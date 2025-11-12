"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Menu, X, Bell, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Notification as NotificationType,
  AppointmentData, 
  RescheduleNotificationData,
  User 
} from "../types";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  // ✅ useRef for tracking processed appointments AFTER clear all
  const processedAfterClearRef = useRef<Set<string>>(new Set());
  // ✅ Track last known appointment data to detect changes
  const lastAppointmentsDataRef = useRef<Map<string, AppointmentData>>(new Map());
  // ✅ NEW: Track if initial data has been loaded
  const initialDataLoadedRef = useRef<boolean>(false);
  // ✅ NEW: Track polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const unreadNotificationsCount = notifications.filter(notif => !notif.isRead).length;

  // ✅ User-specific localStorage keys
  const getUserStorageKey = (key: string) => {
    return user?.id ? `${key}_${user.id}` : key;
  };

  // ✅ LocalStorage se notifications load karo - USER SPECIFIC
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    if (typeof window !== 'undefined') {
      const userNotificationsKey = getUserStorageKey('userNotifications');
      const userProcessedAppointmentsKey = getUserStorageKey('processedAppointments');
      const userLastAppointmentsDataKey = getUserStorageKey('lastAppointmentsData');
      const userInitialDataLoadedKey = getUserStorageKey('initialDataLoaded');
      
      const savedNotifications = localStorage.getItem(userNotificationsKey);
      const savedProcessedAppointments = localStorage.getItem(userProcessedAppointmentsKey);
      const savedLastAppointmentsData = localStorage.getItem(userLastAppointmentsDataKey);
      const savedInitialDataLoaded = localStorage.getItem(userInitialDataLoadedKey);
      
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed || []);
        } catch (error) {
          console.error('Error loading notifications from localStorage:', error);
        }
      }

      // ✅ Load processed appointments bhi - USER SPECIFIC
      if (savedProcessedAppointments) {
        try {
          const parsed = JSON.parse(savedProcessedAppointments);
          processedAfterClearRef.current = new Set(parsed);
          console.log("📋 Loaded processed appointments for user:", user.id, parsed.length);
        } catch (error) {
          console.error('Error loading processed appointments from localStorage:', error);
        }
      }

      // ✅ Load last appointments data - USER SPECIFIC
      if (savedLastAppointmentsData) {
        try {
          const parsed = JSON.parse(savedLastAppointmentsData);
          lastAppointmentsDataRef.current = new Map(Object.entries(parsed));
          console.log("📋 Loaded last appointments data for user:", user.id, lastAppointmentsDataRef.current.size);
        } catch (error) {
          console.error('Error loading last appointments data from localStorage:', error);
        }
      }

      // ✅ Load initial data loaded flag - USER SPECIFIC
      if (savedInitialDataLoaded) {
        initialDataLoadedRef.current = JSON.parse(savedInitialDataLoaded);
      }
    }
  }, [isAuthenticated, user]);

  const saveNotificationsToStorage = (notifs: NotificationType[]) => {
    if (!user?.id) return;
    
    if (typeof window !== 'undefined') {
      const userNotificationsKey = getUserStorageKey('userNotifications');
      localStorage.setItem(userNotificationsKey, JSON.stringify(notifs));
    }
  };

  // ✅ Save processed appointments to localStorage - USER SPECIFIC
  const saveProcessedAppointmentsToStorage = (appointments: Set<string>) => {
    if (!user?.id) return;
    
    if (typeof window !== 'undefined') {
      const userProcessedAppointmentsKey = getUserStorageKey('processedAppointments');
      localStorage.setItem(userProcessedAppointmentsKey, JSON.stringify([...appointments]));
    }
  };

  // ✅ Save last appointments data to localStorage - USER SPECIFIC
  const saveLastAppointmentsDataToStorage = (data: Map<string, AppointmentData>) => {
    if (!user?.id) return;
    
    if (typeof window !== 'undefined') {
      const userLastAppointmentsDataKey = getUserStorageKey('lastAppointmentsData');
      const obj = Object.fromEntries(data);
      localStorage.setItem(userLastAppointmentsDataKey, JSON.stringify(obj));
    }
  };

  // ✅ Save initial data loaded flag - USER SPECIFIC
  const saveInitialDataLoadedToStorage = (loaded: boolean) => {
    if (!user?.id) return;
    
    if (typeof window !== 'undefined') {
      const userInitialDataLoadedKey = getUserStorageKey('initialDataLoaded');
      localStorage.setItem(userInitialDataLoadedKey, JSON.stringify(loaded));
    }
  };

  // ✅ Function to handle new reschedule
  const handleNewReschedule = (data: RescheduleNotificationData) => {
    const newNotification: NotificationType = {
      type: 'reschedule',
      id: `reschedule_${data.appointmentId}_${Date.now()}`,
      appointmentId: data.appointmentId,
      doctorName: data.doctorName || "Unknown Doctor",
      date: data.date,
      time: data.time,
      rescheduleCount: data.rescheduleCount || 0,
      updatedAt: data.updatedAt,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => {
      // ✅ REMOVE OLD NOTIFICATIONS FOR SAME APPOINTMENT (keep only latest)
      const otherNotifications = prev.filter(notif => notif.appointmentId !== data.appointmentId);
      
      // ✅ Add new notification at the beginning
      const updatedNotifications = [newNotification, ...otherNotifications];
      
      // ✅ Sort by createdAt (newest first)
      updatedNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // ✅ Limit to last 20 notifications
      const finalNotifications = updatedNotifications.slice(0, 20);
      
      saveNotificationsToStorage(finalNotifications);
      return finalNotifications;
    });

    setHasNewNotifications(true);
    
    // ✅ Show toast
    toast.info(
      <div className="flex flex-col gap-1">
        <span className="font-semibold">Your Appointment Rescheduled!</span>
        <span className="text-sm">
          {newNotification.doctorName} - {new Date(newNotification.date).toLocaleDateString()} at {newNotification.time}
        </span>
        {newNotification.rescheduleCount && newNotification.rescheduleCount > 0 && (
          <span className="text-xs text-gray-600">
            Rescheduled {newNotification.rescheduleCount} time(s)
          </span>
        )}
      </div>,
      { 
        autoClose: 5000,
        position: "top-right",
        toastId: newNotification.id
      }
    );

    // ✅ Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Your Appointment Rescheduled - ${newNotification.doctorName}`, {
        body: `New date: ${new Date(newNotification.date).toLocaleDateString()} at ${newNotification.time}`,
        icon: "/favicon.ico"
      });
    }

    console.log("✅ New reschedule notification created for appointment:", data.appointmentId);
  };

  // ✅ OPTIMIZED POLLING - Har 30 seconds mein check (increased from 5 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // ✅ Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const checkForReschedules = async () => {
      try {
        console.log("🔍 Checking reschedules for user:", user.id);
        const response = await fetch(`/api/appointments?userId=${user.id}`);
        if (!response.ok) return;

        const data = await response.json();
        const appointments = data.appointments || [];

        if (appointments.length > 0) {
          console.log("📋 Appointments found for user", user.id, ":", appointments.length);

          // ✅ Fetch doctors for names
          const doctorsRes = await fetch(`/api/doctors`);
          const doctorsData = await doctorsRes.json();
          const doctors = doctorsData.doctors || doctorsData || [];

          const newAppointmentsData = new Map<string, AppointmentData>();
          
          const rescheduledAppointments: RescheduleNotificationData[] = [];

          appointments.forEach((appointment: any) => {
            // ✅ IMPORTANT: Only process appointments for current user
            if (appointment.status === "booked" && appointment.userId === user.id) {
              const currentAppointmentData: AppointmentData = { 
                date: appointment.date, 
                time: appointment.time 
              };
              newAppointmentsData.set(appointment.id, currentAppointmentData);

              // ✅ Check if this appointment was rescheduled (date/time changed)
              const lastAppointmentData = lastAppointmentsDataRef.current.get(appointment.id);
              
              // ✅ IMPORTANT FIX: Only check for reschedule if initial data is loaded
              if (lastAppointmentData && initialDataLoadedRef.current) {
                // ✅ RESCHEDULE DETECTED: Date ya time change hua hai
                const isRescheduled = 
                  lastAppointmentData.date !== appointment.date || 
                  lastAppointmentData.time !== appointment.time;

                if (isRescheduled) {
                  console.log("🔄 RESCHEDULE DETECTED for user", user.id, ":", {
                    appointmentId: appointment.id,
                    oldDate: lastAppointmentData.date,
                    newDate: appointment.date,
                    oldTime: lastAppointmentData.time,
                    newTime: appointment.time
                  });

                  const doctor = doctors.find((d: any) => d.id === appointment.doctorId);
                  
                  const notificationData: RescheduleNotificationData = {
                    appointmentId: appointment.id,
                    doctorName: doctor?.name || "Unknown Doctor",
                    date: appointment.date,
                    time: appointment.time,
                    rescheduleCount: appointment.rescheduleCount || 0,
                    updatedAt: appointment.updatedAt || appointment.createdAt,
                  };

                  rescheduledAppointments.push(notificationData);
                }
              }
            }
          });

          // ✅ Process rescheduled appointments
          rescheduledAppointments.forEach(notificationData => {
            handleNewReschedule(notificationData);
          });

          // ✅ Update last appointments data for next comparison
          lastAppointmentsDataRef.current = newAppointmentsData;
          saveLastAppointmentsDataToStorage(lastAppointmentsDataRef.current);

          if (rescheduledAppointments.length > 0) {
            console.log("📊 Rescheduled appointments detected for user", user.id, ":", rescheduledAppointments.length);
          }
        }
      } catch (error) {
        console.error("Error checking reschedules for user", user.id, ":", error);
      }
    };

    // ✅ Initial check - pehle appointments load karo for comparison
    const loadInitialAppointments = async () => {
      try {
        const response = await fetch(`/api/appointments?userId=${user.id}`);
        if (!response.ok) return;

        const data = await response.json();
        const appointments = data.appointments || [];

        const initialAppointmentsData = new Map<string, AppointmentData>();
        
        appointments.forEach((appointment: any) => {
          // ✅ IMPORTANT: Only process appointments for current user
          if (appointment.status === "booked" && appointment.userId === user.id) {
            initialAppointmentsData.set(appointment.id, {
              date: appointment.date,
              time: appointment.time
            });
          }
        });

        // ✅ IMPORTANT: Mark initial data as loaded AFTER first successful load
        if (!initialDataLoadedRef.current) {
          initialDataLoadedRef.current = true;
          saveInitialDataLoadedToStorage(true);
          console.log("✅ Initial data loaded for user", user.id, "- Now reschedule detection will work");
        }

        // ✅ Always update with latest data
        lastAppointmentsDataRef.current = initialAppointmentsData;
        saveLastAppointmentsDataToStorage(lastAppointmentsDataRef.current);
        console.log("📋 Appointments data updated for user", user.id, ":", initialAppointmentsData.size);

        // ✅ Start polling with 30 seconds interval (reduced frequency)
        pollingIntervalRef.current = setInterval(checkForReschedules, 30000); // 30 seconds
      } catch (error) {
        console.error("Error loading initial appointments for user", user.id, ":", error);
      }
    };

    loadInitialAppointments();

    // ✅ Cleanup function - clear interval on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // ... (rest of the component remains the same)

  const handleProtectedClick = (path: string) => {
    if (!isAuthenticated)
      toast.info("Please log in first to access this page.");
    else router.push(path);
  };

  const handleLoginBtn = () => router.push("/auth/user/login");
  
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleBellClick = () => {
    setShowPopup((prev) => !prev);
    
    if (notifications.length > 0 && unreadNotificationsCount > 0) {
      const updatedNotifications = notifications.map(notif => ({
        ...notif,
        isRead: true
      }));
      setNotifications(updatedNotifications);
      saveNotificationsToStorage(updatedNotifications);
      setHasNewNotifications(false);
    }
  };

  // ✅ COMPLETELY FIXED: Clear all notifications - USER SPECIFIC
  const clearAllNotifications = () => {
    console.log("🗑️ CLEAR ALL TRIGGERED for user", user?.id);
    
    // ✅ COMPLETE RESET
    setNotifications([]);
    setHasNewNotifications(false);
    
    // ✅ IMPORTANT: Also clear processed appointments when clearing all notifications
    processedAfterClearRef.current.clear();
    saveProcessedAppointmentsToStorage(processedAfterClearRef.current);
    
    // ✅ LocalStorage se COMPLETELY remove karo - USER SPECIFIC
    if (typeof window !== 'undefined' && user?.id) {
      const userNotificationsKey = getUserStorageKey('userNotifications');
      localStorage.removeItem(userNotificationsKey);
    }
    
    toast.success("All notifications cleared");
    console.log("✅ COMPLETE RESET for user", user?.id, ": Everything cleared");
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);
    saveNotificationsToStorage(updatedNotifications);
    
    const hasUnread = updatedNotifications.some(notif => !notif.isRead);
    setHasNewNotifications(hasUnread);
  };

  return (
    <nav className="relative bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg z-50 fixed w-full top-0">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 focus:outline-none"
          style={{ background: "none", border: "none" }}
        >
          <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 p-2.5 rounded-2xl shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              HopeCare Hospital
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Compassion • Care • Cure
            </p>
          </div>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <button
            onClick={() => handleProtectedClick("/user/find-doctors")}
            className="text-sm font-semibold text-gray-700 hover:text-cyan-600 transition-colors"
          >
            Find a Doctor
          </button>
          <button
            onClick={() => handleProtectedClick("/user/my-appointments")}
            className="text-sm font-semibold text-gray-700 hover:text-cyan-600 transition-colors"
          >
            My Appointments
          </button>
          <a
            href="#contact"
            className="text-sm font-semibold text-gray-700 hover:text-cyan-600 transition-colors"
          >
            Contact
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadNotificationsCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md ${
                    hasNewNotifications ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'
                  }`}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden z-50"
                  >
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Notifications
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {notifications.length} notification(s)
                          {unreadNotificationsCount > 0 && (
                            <span className="text-red-600 font-semibold ml-2">
                              ({unreadNotificationsCount} new)
                            </span>
                          )}
                        </p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-3 space-y-3">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                              No notifications yet.
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              You'll see reschedule notifications here
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification: NotificationType) => (
                            <div
                              key={notification.id}
                              className={`border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                notification.isRead 
                                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' 
                                  : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <p className="text-sm font-semibold text-gray-800 flex-1">
                                  Appointment Rescheduled
                                </p>
                                {!notification.isRead && (
                                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold">{notification.doctorName}</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                New date:{" "}
                                <span className="font-semibold text-purple-600">
                                  {new Date(notification.date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })} at {notification.time}
                                </span>
                              </p>
                              {notification.rescheduleCount && notification.rescheduleCount > 0 && (
                                <p className="text-xs text-purple-600 font-semibold mt-1">
                                  Rescheduled {notification.rescheduleCount} time(s)
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <style jsx>{`
                      .max-h-80::-webkit-scrollbar {
                        width: 6px;
                      }
                      .max-h-80::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 3px;
                      }
                      .max-h-80::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 3px;
                      }
                      .max-h-80::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                      }
                    `}</style>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Auth buttons */}
          {isAuthenticated ? (
            <button
              className="hidden md:block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button
              className="hidden md:block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              onClick={handleLoginBtn}
            >
              Login
            </button>
          )}

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden bg-gradient-to-r from-cyan-50 to-blue-50 p-2 rounded-xl border border-cyan-200"
          >
            {mobileOpen ? (
              <X className="w-6 h-6 text-cyan-600" />
            ) : (
              <Menu className="w-6 h-6 text-cyan-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200">
          <div className="px-5 py-4 flex flex-col gap-2">
            <button
              onClick={() => handleProtectedClick("/user/find-doctors")}
              className="block text-left px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 text-gray-700 font-semibold text-sm transition-all"
            >
              Find a Doctor
            </button>
            <button
              onClick={() => handleProtectedClick("/user/my-appointments")}
              className="block text-left px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 text-gray-700 font-semibold text-sm transition-all"
            >
              My Appointments
            </button>
            <a
              href="#contact"
              className="block px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 text-gray-700 font-semibold text-sm transition-all"
            >
              Contact
            </a>
            {isAuthenticated ? (
              <button
                className="text-white px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <button
                className="text-white px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"
                onClick={handleLoginBtn}
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}