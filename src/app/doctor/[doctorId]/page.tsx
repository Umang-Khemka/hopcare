"use client";

import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import {
  Bell,
  Award,
  Calendar,
  Clock,
  User,
  TrendingUp,
  RotateCw,
  LogOut,
  MapPin,
  ClipboardList,
  Users,
  CheckCircle2,
  FileText,
  Stethoscope,
  Pill,
  Heart,
  Star,
  Activity,
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Appointment, Doctor, Prescription, Feedback } from "@/src/types";
import { listenBooking } from "@/src/lib/bookingbus";

const DoctorDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const { doctorId } = useParams();

  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allTodayAppointments, setAllTodayAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [statusPopup, setStatusPopup] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const FEEDBACKS_PER_PAGE = 5;

  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: "",
    medicines: [{ name: "", days: "", timesPerDay: "" }],
    advice: "",
    followUp: "",
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Fetch Feedbacks with Infinite Scroll
  const fetchFeedbacks = async (page: number = 1, append: boolean = false) => {
    if (!user?.id) return;
    
    setLoadingFeedbacks(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const allFeedbacksData = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      const doctorFeedbacks = allFeedbacksData.filter(
        (feedback: Feedback) => feedback.doctorId === user.id
      );

      // Sort by latest first
      doctorFeedbacks.sort((a: Feedback, b: Feedback) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Store all feedbacks
      setAllFeedbacks(doctorFeedbacks);

      // Calculate rating distribution - FIXED TYPE ERROR
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      doctorFeedbacks.forEach((fb: Feedback) => {
        const rating = fb.rating;
        if (rating === 5) distribution[5]++;
        else if (rating === 4) distribution[4]++;
        else if (rating === 3) distribution[3]++;
        else if (rating === 2) distribution[2]++;
        else if (rating === 1) distribution[1]++;
      });
      setRatingDistribution(distribution);

      // Apply rating filter if any
      let filteredFeedbacks = doctorFeedbacks;
      if (ratingFilter) {
        filteredFeedbacks = doctorFeedbacks.filter((fb: Feedback) => fb.rating === ratingFilter);
      }

      // Infinite scroll logic - load all feedbacks
      if (append) {
        // For infinite scroll, just add more feedbacks
        setFeedbacks(prev => [...prev, ...filteredFeedbacks.slice(prev.length)]);
        setHasMore(feedbacks.length < filteredFeedbacks.length);
      } else {
        // Initial load - show first batch
        const initialFeedbacks = filteredFeedbacks.slice(0, FEEDBACKS_PER_PAGE * page);
        setFeedbacks(initialFeedbacks);
        setHasMore(initialFeedbacks.length < filteredFeedbacks.length);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // Load more feedbacks for infinite scroll
  const loadMoreFeedbacks = () => {
    if (!loadingFeedbacks && hasMore) {
      fetchFeedbacks(currentPage + 1, true);
    }
  };

  // Apply rating filter
  const applyRatingFilter = (rating: number | null) => {
    setRatingFilter(rating);
    setCurrentPage(1);
    setFeedbacks([]);
  };

  // Time ago function
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  };

  // Calculate rating statistics
  const calculateRatingStats = () => {
    const total = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return { average: 0, total: 0, percentages: [] };

    const sum = Object.entries(ratingDistribution).reduce((acc, [rating, count]) => 
      acc + (parseInt(rating) * count), 0
    );
    const average = sum / total;
    
    const percentages = Object.entries(ratingDistribution).map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    return { average: Math.round(average * 10) / 10, total, percentages };
  };

  useEffect(() => {
    const stopListening = listenBooking((newBooking) => {
      console.log("📥 NEW BOOKING RECEIVED:", newBooking);
      const booking = newBooking as Appointment;
      setNotifications((prev) => [booking, ...prev]);
      setAppointments((prev) => [booking, ...prev]);
      setAllTodayAppointments((prev) => [booking, ...prev]);
      toast.success(`New booking from ${newBooking.patientName}!`);
    });
    return stopListening;
  }, []);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) return;
      try {
        const res = await fetch("/api/doctors");
        const data = await res.json();
        const found = data.find((d: Doctor) => d.id === doctorId);
        setDoctorInfo(found || null);
      } catch (err) {
        console.error("Error fetching doctor:", err);
      }
    };
    fetchDoctorDetails();
    fetchFeedbacks(1); // Load initial feedbacks
  }, [doctorId]);

  // Auto-refresh feedbacks
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeedbacks(1);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Refetch feedbacks when filter changes
  useEffect(() => {
    fetchFeedbacks(1);
  }, [ratingFilter]);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (data.success) setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    }
  };

  function getLocalDateYMD() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  const goToSchedule = () => {
    if (user?.id) router.push(`/doctor/${user.id}/schedule`);
    else router.push("/");
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorId) return;
      setLoading(true);
      try {
        const today = getLocalDateYMD();
        const res = await fetch(
          `/api/appointments?doctorId=${doctorId}&date=${today}`
        );
        const data = await res.json();
        if (data.appointments) {
          const todayAppointments = data.appointments.filter(
            (a: Appointment) => a.status === "booked" || a.status === "completed"
          );
          setAllTodayAppointments(todayAppointments);
          
          const bookedAppointments = data.appointments.filter(
            (a: Appointment) => a.status === "booked"
          );
          setAppointments(bookedAppointments);
          
          const bookedNotifications = data.appointments.filter(
            (a: Appointment) => a.status === "booked"
          );
          setNotifications(bookedNotifications);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
    fetchPrescriptions();
  }, [doctorId]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const addMedicine = () => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: [
        ...prescriptionData.medicines,
        { name: "", days: "", timesPerDay: "" },
      ],
    });
  };

  const removeMedicine = (index: number) => {
    const newMedicines = prescriptionData.medicines.filter(
      (_, i) => i !== index
    );
    setPrescriptionData({
      ...prescriptionData,
      medicines: newMedicines,
    });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMedicines = prescriptionData.medicines.map((medicine, i) =>
      i === index ? { ...medicine, [field]: value } : medicine
    );
    setPrescriptionData({
      ...prescriptionData,
      medicines: newMedicines,
    });
  };

  const givePrescription = async () => {
    const hasValidMedicine = prescriptionData.medicines.some(
      (med) => med.name.trim() !== ""
    );

    if (!prescriptionData.diagnosis.trim() || !hasValidMedicine) {
      alert("Please fill Diagnosis & at least one Medicine name");
      return;
    }

    try {
      const medicinesToSend = prescriptionData.medicines.filter(
        (med) => med.name.trim() !== ""
      );

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment?.id,
          diagnosis: prescriptionData.diagnosis,
          medicines: medicinesToSend,
          advice: prescriptionData.advice,
          followUp: prescriptionData.followUp,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Prescription saved!");
        setShowPrescriptionModal(false);
        setPrescriptionData({
          diagnosis: "",
          medicines: [{ name: "", days: "", timesPerDay: "" }],
          advice: "",
          followUp: "",
        });
        fetchPrescriptions();

        const today = getLocalDateYMD();
        const appointmentsRes = await fetch(
          `/api/appointments?doctorId=${doctorId}&date=${today}`
        );
        const appointmentsData = await appointmentsRes.json();
        if (appointmentsData.appointments) {
          const todayAppointments = appointmentsData.appointments.filter(
            (a: Appointment) => a.status === "booked" || a.status === "completed"
          );
          setAllTodayAppointments(todayAppointments);
          
          const bookedAppointments = appointmentsData.appointments.filter(
            (a: Appointment) => a.status === "booked"
          );
          setAppointments(bookedAppointments);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPrescriptionModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionData({
      diagnosis: "",
      medicines: [{ name: "", days: "", timesPerDay: "" }],
      advice: "",
      followUp: "",
    });
    setShowPrescriptionModal(true);
  };

  const openViewPrescriptionModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowViewPrescriptionModal(true);
  };

  const handleStatusChange = async (appointmentId: any, status: any) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update");

      toast.success("Status Changed");
      setStatusPopup(false);
      
      const today = getLocalDateYMD();
      const appointmentsRes = await fetch(
        `/api/appointments?doctorId=${doctorId}&date=${today}`
      );
      const appointmentsData = await appointmentsRes.json();
      if (appointmentsData.appointments) {
        const todayAppointments = appointmentsData.appointments.filter(
          (a: Appointment) => a.status === "booked" || a.status === "completed"
        );
        setAllTodayAppointments(todayAppointments);
        
        const bookedAppointments = appointmentsData.appointments.filter(
          (a: Appointment) => a.status === "booked"
        );
        setAppointments(bookedAppointments);
        
        const bookedNotifications = appointmentsData.appointments.filter(
          (a: Appointment) => a.status === "booked"
        );
        setNotifications(bookedNotifications);
      }
    } catch (error) {
      console.error("Error confirming:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    }
  };

  const handleGivePrescriptionClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/doctor/${doctorId}/prescription/${appointment.id}`);
  };

  const handleHistorySearch = () => {
    router.push(`/doctor/${doctorId}/history`);
  };

  const handleViewMedicalReports = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/doctor/${doctorId}/medical-reports?patientName=${encodeURIComponent(appointment.patientName)}`);
  };

  if (!doctorInfo)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading doctor details...</p>
        </div>
      </div>
    );

  const ratingStats = calculateRatingStats();

  const statCards = [
    {
      label: "Today's Appointments",
      value: allTodayAppointments.length,
      icon: Calendar,
      gradient: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-50",
      description: "Scheduled for today",
    },
    {
      label: "Total Patients",
      value: 127,
      icon: User,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      description: "All time patients",
    },
    {
      label: "Average Rating",
      value: ratingStats.average || 4.9,
      icon: Star,
      gradient: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      description: `Based on ${ratingStats.total} reviews`,
    },
    {
      label: "Success Rate",
      value: "98%",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      description: "Patient satisfaction",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 relative overflow-hidden font-sans">
      {/* HEADER */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative group">
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-105">
                <Stethoscope className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">
                <span className="text-gray-900">Welcome back, </span>
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {doctorInfo.name}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  Here's your dashboard overview for today
                </span>
                <span className="sm:hidden">Dashboard overview</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto justify-end">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-3 rounded-xl bg-white/50 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 group border border-white/50"
              >
                <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 group-hover:text-cyan-600 transition-colors" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-lg">
                    {notifications.length}
                  </span>
                )}   
              </button>

              {showNotifications && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 z-50 w-80
                      bg-white/80 backdrop-blur-xl rounded-2xl border border-cyan-200 shadow-2xl p-4 animate-slideFade"
                >    
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900">Notifications</h4>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-xs text-cyan-700 hover:text-cyan-900 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-6">No notifications</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scroll">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 hover:shadow-md transition cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-cyan-600 text-white rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{notif.patientName}</p>
                            <p className="text-xs text-gray-600">Slot time {notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-tranform duration-300 hover:scale-105 text-gray-800"
            >
              <RotateCw className="w-4 h-4" /> Refresh
            </button>

            <button
              onClick={() => window.location.reload()}
              className="sm:hidden p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all text-gray-800"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="group relative transition-transform duration-300 hover:scale-105"
            >
              <div className="relative flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xl hover:shadow-2xl transition-all">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="group relative">
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">
                      {stat.value}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {stat.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div
                    className={`p-4 ${stat.bgColor} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <stat.icon className="w-7 h-7 text-gray-700" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule and Patient Feedback Combined */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Schedule */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="relative">
                      <div className="relative w-12 h-12 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-105">
                        <Calendar className="w-6 h-6 text-cyan-600" />
                      </div>
                    </div>
                    Today's Schedule
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-3 rounded-2xl border border-cyan-200">
                  <p className="text-xs text-gray-600 font-semibold uppercase">
                    Today's Appointments
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {allTodayAppointments.length}
                  </p>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-r from-cyan-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Calendar className="w-10 h-10 text-cyan-600" />
                  </div>
                  <p className="text-gray-900 font-bold text-xl mb-2">
                    {allTodayAppointments.length === 0 ? "No appointments scheduled" : "All appointments completed for today"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {allTodayAppointments.length === 0 ? "Your schedule is clear for today." : "Great job! All today's appointments are completed."}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {appointments.map((a) => {
                    const existingPrescription = prescriptions.find(
                      (p) => p.appointmentId === a.id
                    );

                    return (
                      <div
                        key={a.id}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm border-2 border-white/80 rounded-3xl p-6 hover:border-cyan-300 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wide shadow-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                                  booked
                                </span>
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-semibold">
                                    {a.time}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-sm opacity-50"></div>
                                  <div className="relative w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <User className="w-7 h-7 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {a.patientName}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                                      <User className="w-4 h-4 text-purple-600" />
                                      <span className="font-semibold">
                                        {a.patientAge} years
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                      <Calendar className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold">
                                        {new Date(a.date).toLocaleDateString(
                                          "en-IN"
                                        )}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {a.symptoms && (
                                <div className="mt-5 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                                  <p className="text-sm text-gray-700 italic">
                                    "{a.symptoms}"
                                  </p>
                                </div>
                              )}

                              <div className="mt-5 flex gap-3">
                                {!existingPrescription && (
                                  <button
                                    onClick={(e) => handleGivePrescriptionClick(a, e)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                  >
                                    <Pill className="w-4 h-4" />
                                    Give Prescription
                                  </button>
                                )}

                                {existingPrescription && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openViewPrescriptionModal(a);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Prescription
                                  </button>
                                )}

                                <button
                                  onClick={(e) => handleViewMedicalReports(a, e)}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  View Medical Reports
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(a);
                                    setStatusPopup(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Change Status
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Patient Feedback Section - WITH FILTER */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="relative w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Patient Feedback & Reviews
                  </h3>
                  <p className="text-sm text-gray-600">
                    What your patients are saying about your service
                  </p>
                </div>
              </div>

              {/* Rating Distribution - DYNAMIC BARS BASED ON STAR RATINGS */}
              {ratingStats.total > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <h4 className="text-lg font-bold text-gray-700 mb-4">Rating Distribution</h4>
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const stat = ratingStats.percentages?.find(s => s.rating === rating);
                      const percentage = stat?.percentage || 0;
                      const count = stat?.count || 0;
                      
                      return (
                        <div key={rating} className="flex flex-col gap-2">
                          {/* Stars and percentage - ABOVE the bar */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm font-medium text-gray-700 ml-1">
                                {rating}.0
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                {count} {count === 1 ? 'review' : 'reviews'}
                              </span>
                              <span className="text-sm font-medium text-gray-800 w-10 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar - BELOW the stars */}
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Star Rating Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyRatingFilter(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      ratingFilter === null
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Reviews
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => applyRatingFilter(rating)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                        ratingFilter === rating
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${ratingFilter === rating ? 'text-white' : 'text-yellow-400'}`} />
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback List - WITH SCROLLBAR */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-4 custom-scroll">
                {feedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {ratingFilter 
                        ? `No ${ratingFilter}-star reviews found` 
                        : "No feedback received yet"
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {feedbacks.map((feedback, index) => (
                      <div 
                        key={feedback.id} 
                        className={`p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 hover:shadow-lg transition-all duration-300 ${
                          index === feedbacks.length - 1 && hasMore ? 'mb-2' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2">
                              {feedback.patientName}
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= feedback.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-500 ml-2">
                                ({feedback.rating}.0)
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {getTimeAgo(feedback.createdAt)}
                          </span>
                        </div>
                        
                        {/* MESSAGE DISPLAY */}
                        {feedback.message && (
                          <div className="mt-4 p-4 bg-white/80 rounded-xl border border-white/50">
                            <p className="text-gray-700 leading-relaxed">
                              "{feedback.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Load More Button for Infinite Scroll */}
                    {hasMore && (
                      <div className="text-center pt-6">
                        <button
                          onClick={loadMoreFeedbacks}
                          disabled={loadingFeedbacks}
                          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                        >
                          {loadingFeedbacks ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Loading More Reviews...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-5 h-5" />
                              Load More Reviews
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Loading Indicator */}
                    {loadingFeedbacks && (
                      <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading more reviews...</p>
                      </div>
                    )}

                    {/* End of Results */}
                    {!hasMore && feedbacks.length > 0 && (
                      <div className="text-center py-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                          <p className="text-green-700 font-medium">
                            🎉 You've seen all {ratingFilter ? `${ratingFilter}-star` : ''} {feedbacks.length} reviews!
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - ONLY PROFILE AND QUICK ACTIONS */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="relative w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Your Profile
                  </h3>
                  <p className="text-sm text-gray-600">
                    Professional information
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">
                      Speciality
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {doctorInfo.specialization}
                    </p>
                  </div>
                  <Stethoscope className="w-5 h-5 text-cyan-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">
                      Experience
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {doctorInfo.experience}
                    </p>
                  </div>
                  <Award className="w-5 h-5 text-purple-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">
                      Consultation Fee
                    </p>
                    <p className="text-sm font-bold text-gray-900">₹1000</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">
                      Location
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {doctorInfo.location}
                    </p>
                  </div>
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-bold text-green-800">
                    Verified Doctor
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="relative w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Frequently used features
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={goToSchedule}
                  className="w-full group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3 p-4 text-left bg-white/90 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-2xl border border-white/80 hover:border-cyan-300 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div className="w-11 h-11 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">View Schedule</p>
                      <p className="text-xs text-gray-600">
                        Manage appointments
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full group relative" onClick={handleHistorySearch}>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3 p-4 text-left bg-white/90 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-2xl border border-white/80 hover:border-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div className="w-11 h-11 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">View Patients</p>
                      <p className="text-xs text-gray-600">Patient records</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/doctor/${doctorId}/completed`)}
                  className="w-full group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3 p-4 text-left bg-white/90 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-2xl border border-white/80 hover:border-green-300 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div className="w-11 h-11 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Completed</p>
                      <p className="text-xs text-gray-600">
                        Past consultations
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Popup */}
      {statusPopup && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-900">
              Change Status for {selectedAppointment.patientName}
            </h3>
            <div className="flex gap-3 justify-center mt-8">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={async () => {
                  await handleStatusChange(
                    selectedAppointment.id,
                    "cancelled"
                  );
                }}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={async () => {
                  await handleStatusChange(
                    selectedAppointment.id,
                    "completed"
                  );
                }}
              >
                Complete
              </button>
              <button
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold ml-2 hover:scale-105"
                onClick={() => setStatusPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {showViewPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl border border-white/50 max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl"></div>
            <div className="relative p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-green-600" />
                  Prescription Details for {selectedAppointment.patientName}
                </h3>
                <button
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {(() => {
                const prescription = prescriptions.find(
                  (p) => p.appointmentId === selectedAppointment.id
                );
                
                if (!prescription) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No prescription found</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Diagnosis */}
                    <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-2">
                        Diagnosis
                      </p>
                      <p className="text-gray-900 font-semibold text-lg">
                        {prescription.diagnosis}
                      </p>
                    </div>

                    {/* Medicines */}
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-4">
                        Prescribed Medicines
                      </p>
                      <div className="space-y-4">
                        {prescription.medicines && prescription.medicines.length > 0 ? (
                          prescription.medicines.map((medicine, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white/80 rounded-xl border border-white/50 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-bold text-gray-900 text-lg mb-1">
                                    {medicine.name}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      {medicine.type || 'Tablet'}
                                    </span>
                                    {medicine.dosage && (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                                        Dosage: {medicine.dosage}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Pill className="w-6 h-6 text-purple-600 flex-shrink-0" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-700">
                                    <strong>Duration:</strong> {medicine.duration || medicine.days || 'Not specified'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="text-gray-700">
                                    <strong>Frequency:</strong> {medicine.frequency || (medicine.timesPerDay ? `${medicine.timesPerDay} times/day` : 'Not specified')}
                                  </span>
                                </div>

                                {medicine.instructions && (
                                  <div className="md:col-span-2">
                                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                                      <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded">
                                        Note
                                      </span>
                                      <span className="text-gray-700 text-sm">
                                        {medicine.instructions}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No medicines prescribed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Advice */}
                    {prescription.advice && (
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">
                          Medical Advice
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {prescription.advice}
                        </p>
                      </div>
                    )}

                    {/* Follow-up */}
                    {prescription.followUp && (
                      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">
                          Follow-up Date
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(prescription.followUp).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105 text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;