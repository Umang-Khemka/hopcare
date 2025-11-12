"use client";
import { toast } from "react-toastify";
import React, { useEffect, useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useParams } from "next/navigation";
import { Appointment } from "@/src/types";
import {
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { AppointmentResponse } from "@/src/types";
import MiniCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function FullCalendarView() {
  const { doctorId } = useParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    showBelow?: boolean;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = React.useRef<any>(null);

  // Reschedule count state
  const [rescheduleCount, setRescheduleCount] = useState<number>(0);

  // Current date ko properly set karo
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarKey, setCalendarKey] = useState<number>(0);

  const stats = useMemo(() => {
    const booked = events.filter(
      (e) => e.extendedProps.status === "booked"
    ).length;
    const completed = events.filter(
      (e) => e.extendedProps.status === "completed"
    ).length;
    const cancelled = events.filter(
      (e) => e.extendedProps.status === "cancelled"
    ).length;
    const total = events.length;

    return { booked, completed, cancelled, total };
  }, [events]);

  const mapAppointmentsToEvents = (appointments: Appointment[]) => {
    return appointments.map((a) => {
      const timeStr = a.time.length === 5 ? a.time : a.time.slice(0, 5);
      
      const startDateTime = new Date(`${a.date}T${timeStr}:00`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 30);

      return {
        id: a.id, // ✅ Actual appointment ID use karo
        title: `${a.patientName} (${a.patientAge} yrs)`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        display: "block",
        extendedProps: {
          symptoms: a.symptoms,
          status: a.status,
          patientName: a.patientName,
          patientAge: a.patientAge,
          date: a.date,
          time: a.time,
          rescheduleCount: a.rescheduleCount || 0,
          appointmentId: a.id, // ✅ Extra property for backup
        },
      };
    });
  };

  const fetchDoctorAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/appointments?doctorId=${doctorId}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      
      if (data.appointments && Array.isArray(data.appointments)) {
        const mappedEvents = mapAppointmentsToEvents(data.appointments);
        setEvents(mappedEvents);
        
        // Calculate total reschedule count
        const totalReschedules = mappedEvents.reduce((total, event) => {
          return total + (event.extendedProps.rescheduleCount || 0);
        }, 0);
        setRescheduleCount(totalReschedules);
      } else {
        setEvents([]);
        setRescheduleCount(0);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      setEvents([]);
      setRescheduleCount(0);
    } finally {
      setLoading(false);
    }
  };

  const eventDates = React.useMemo(() => {
    return events.map((e) => new Date(e.start).toISOString().split("T")[0]);
  }, [events]);

  const handleMiniDateClick = (date: Date) => {
    setSelectedDate(date);
    const api = calendarRef.current?.getApi();
    api?.changeView("timeGridDay", date);
  };
  
  const handleEventDrop = async ({ event }: any) => {
    try {
      // ✅ Correct way to get appointment ID
      const appointmentId = event.id;
      
      console.log("Rescheduling appointment ID:", appointmentId);

      // ✅ Get new date & time from event.start
      const newDate = event.start.toISOString().split("T")[0];
      const newTime = new Date(event.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      console.log("New date/time:", newDate, newTime);

      // ✅ Send update request with reschedule flag
      const res = await fetch(`/api/appointments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          appointmentId, 
          date: newDate, 
          time: newTime,
          isReschedule: true
        }),
      });

      // ✅ Better error handling
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data: AppointmentResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to reschedule appointment");
      }

      // ✅ Reschedule count update karo
      setRescheduleCount(prev => prev + 1);

      // ✅ Notify & refresh
      toast.success("Appointment rescheduled successfully!");
      fetchDoctorAppointments();
      
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      toast.error(error.message || "Could not reschedule appointment.");
      
      // ✅ Event ko revert karo agar fail hua
      event.revert();
    }
  };

  const handleStatusChange = async (appointmentId: any) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: "completed" }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update");
      }
      
      const data = await res.json();

      toast.success("Status Changed");
      fetchDoctorAppointments();
    } catch (error) {
      console.error("Error confirming:", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    }
  };

  useEffect(() => {
    if (doctorId) fetchDoctorAppointments();
  }, [doctorId]);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setPopup(true);
  };

  // Calendar ko refresh karne ka function
  const refreshCalendar = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  // Component mount hone pe calendar ko refresh karo
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCalendar();
      setCalendarKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // DatesSet handler with debouncing
  const handleDatesSet = React.useCallback((dateInfo: any) => {
    const newMonth = dateInfo.start.getMonth();
    const newYear = dateInfo.start.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    if (newMonth !== currentMonth || newYear !== currentYear) {
      setCurrentDate(dateInfo.start);
    }
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 relative overflow-hidden">
      <div className="relative max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="relative group">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold">
                <span className="text-gray-900">Appointment </span>
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Calendar
                </span>
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Hover for quick info • Click for actions</span>
                <span className="sm:hidden">Tap events for details</span>
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-cyan-200 rounded-full"></div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 sm:mt-6 text-cyan-600 font-bold text-base sm:text-lg">
              Loading appointments...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Statistics Cards - Reschedule Count Add Kiya Hai */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-5">
              {/* Mini Calendar */}
              <div className="p-3 bg-white shadow-md rounded-2xl">
                <MiniCalendar
                  onClickDay={handleMiniDateClick}
                  value={selectedDate}
                  tileClassName={({ date }) => {
                    const dateStr = date.toISOString().split("T")[0];
                    return eventDates.includes(dateStr) ? "has-event" : "";
                  }}
                />
              </div>
              
              {/* Reschedule Count Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Rescheduled
                    </h3>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {rescheduleCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    Total rescheduled appointments
                  </p>
                </div>
              </div>

              {/* Total Appointments */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Total
                    </h3>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-sm opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    All appointments
                  </p>
                </div>
              </div>

              {/* Booked */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Booked
                    </h3>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur-sm opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {stats.booked}
                  </p>
                  <div className="mt-2 sm:mt-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full h-2 sm:h-2.5 overflow-hidden border border-amber-200">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${
                          stats.total > 0
                            ? (stats.booked / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    {stats.total > 0
                      ? ((stats.booked / stats.total) * 100).toFixed(0)
                      : 0}
                    % of total
                  </p>
                </div>
              </div>

              {/* Completed */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Completed
                    </h3>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur-sm opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.completed}
                  </p>
                  <div className="mt-2 sm:mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full h-2 sm:h-2.5 overflow-hidden border border-green-200">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${
                          stats.total > 0
                            ? (stats.completed / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    {stats.total > 0
                      ? ((stats.completed / stats.total) * 100).toFixed(0)
                      : 0}
                    % of total
                  </p>
                </div>
              </div>

              {/* Cancelled */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Cancelled
                    </h3>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl blur-sm opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.cancelled}
                  </p>
                  <div className="mt-2 sm:mt-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-full h-2 sm:h-2.5 overflow-hidden border border-red-200">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-600 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${
                          stats.total > 0
                            ? (stats.cancelled / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    {stats.total > 0
                      ? ((stats.cancelled / stats.total) * 100).toFixed(0)
                      : 0}
                    % of total
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
                <style>
                  {`
                    .fc {
                      font-family: system-ui, -apple-system, sans-serif;
                    }
                    
                    .fc .fc-toolbar-title {
                      font-size: 1.25rem !important;
                      font-weight: 800 !important;
                      background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%);
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      margin: 0 !important;
                    }
                    
                    @media (min-width: 640px) {
                      .fc .fc-toolbar-title {
                        font-size: 1.75rem !important;
                      }
                    }
                    
                    .fc .fc-toolbar {
                      padding: 1rem !important;
                      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%) !important;
                      border-bottom: 2px solid rgba(6, 182, 212, 0.2) !important;
                      flex-direction: column;
                      gap: 0.5rem;
                    }
                    
                    @media (min-width: 768px) {
                      .fc .fc-toolbar {
                        flex-direction: row;
                        padding: 1.5rem !important;
                      }
                    }
                    
                    .fc .fc-toolbar-chunk {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    .fc .fc-button {
                      background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%) !important;
                      border: none !important;
                      border-radius: 12px !important;
                      padding: 0.5rem 1rem !important;
                      font-weight: 700 !important;
                      text-transform: capitalize !important;
                      box-shadow: 0 4px 6px rgba(6, 182, 212, 0.25) !important;
                      transition: all 0.2s ease !important;
                      font-size: 0.75rem !important;
                      margin: 0 0.25rem !important;
                    }
                    
                    @media (min-width: 640px) {
                      .fc .fc-button {
                        padding: 0.625rem 1.25rem !important;
                        font-size: 0.875rem !important;
                        margin: 0 0.8rem !important;
                      }
                    }
                    
                    .fc .fc-button:hover {
                      background: linear-gradient(135deg, #0891b2 0%, #1d4ed8 100%) !important;
                      transform: translateY(-2px) !important;
                      box-shadow: 0 6px 12px rgba(6, 182, 212, 0.35) !important;
                    }
                    
                    .fc .fc-button:disabled {
                      opacity: 0.4 !important;
                      cursor: not-allowed !important;
                      transform: none !important;
                    }
                    
                    .fc .fc-button-active {
                      background: linear-gradient(135deg, #0e7490 0%, #1e40af 100%) !important;
                      box-shadow: 0 2px 8px rgba(14, 116, 144, 0.4) !important;
                    }
                    
                    .fc .fc-col-header-cell {
                      background: linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%) !important;
                      padding: 0.5rem 0.25rem !important;
                      font-weight: 800 !important;
                      color: #475569 !important;
                      border-color: rgba(203, 213, 225, 0.5) !important;
                      text-transform: uppercase !important;
                      font-size: 0.7rem !important;
                      letter-spacing: 0.05em !important;
                    }
                    
                    @media (min-width: 640px) {
                      .fc .fc-col-header-cell {
                        padding: 1rem 0.5rem !important;
                        font-size: 0.75rem !important;
                        letter-spacing: 0.1em !important;
                      }
                    }
                    
                    .fc .fc-timegrid-slot {
                      height: 2.5rem !important;
                      border-color: rgba(241, 245, 249, 0.8) !important;
                      background-color: #ffffff !important;
                    }
                    
                    @media (min-width: 640px) {
                      .fc .fc-timegrid-slot {
                        height: 3rem !important;
                      }
                    }

                    .fc .fc-timegrid-slot:nth-child(even) {
                      background-color: rgba(248, 250, 252, 0.5) !important;
                    }
                    
                    .fc .fc-timegrid-slot-label {
                      color: #64748b !important;
                      font-weight: 700 !important;
                      font-size: 0.7rem !important;
                      padding-right: 0.5rem !important;
                      vertical-align: top !important;
                      padding-top: 0.25rem !important;
                    }
                    
                    @media (min-width: 640px) {
                      .fc .fc-timegrid-slot-label {
                        font-size: 0.75rem !important;
                        padding-right: 0.75rem !important;
                        padding-top: 0.5rem !important;
                      }
                    }
                    
                    .fc .fc-timegrid-now-indicator-line {
                      border-color: #ef4444 !important;
                      border-width: 3px !important;
                    }
                    
                    .fc .fc-timegrid-now-indicator-arrow {
                      border-color: #ef4444 !important;
                      border-width: 6px !important;
                    }
                    
                    .fc-daygrid-day.fc-day-today,
                    .fc-timegrid-col.fc-day-today {
                      background: linear-gradient(135deg, rgba(224, 242, 254, 0.3) 0%, rgba(219, 234, 254, 0.3) 100%) !important;
                    }
                    
                    .fc .fc-scrollgrid {
                      border-color: rgba(226, 232, 240, 0.6) !important;
                    }

                    .fc-timegrid-event-harness {
                      margin: 0 !important;
                      padding: 2px 3px !important;
                    }

                    @media (min-width: 640px) {
                      .fc-timegrid-event-harness {
                        padding: 3px 5px !important;
                      }
                    }

                    .fc-timegrid-event {
                      border-radius: 8px !important;
                      overflow: hidden !important;
                      margin: 0 !important;
                      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
                    }

                    @media (min-width: 640px) {
                      .fc-timegrid-event {
                        border-radius: 10px !important;
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
                      }
                    }

                    .fc-timegrid-event .fc-event-main {
                      padding: 0 !important;
                      height: 100% !important;
                    }

                    .fc-event {
                      border: none !important;
                      margin: 0 !important;
                    }

                    .fc-timegrid-col-events {
                      margin: 0 !important;
                      padding: 0 !important;
                    }

                    .fc .fc-timegrid-slot-lane {
                      border-top: 1px solid rgba(241, 245, 249, 0.8) !important;
                    }

                    .fc-daygrid-event {
                      margin: 1px 2px !important;
                      border-radius: 8px !important;
                      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
                    }

                    @media (min-width: 640px) {
                      .fc-daygrid-event {
                        margin: 2px 3px !important;
                        border-radius: 10px !important;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                      }
                    }

                    .fc-timegrid-event-harness > .fc-timegrid-event {
                      isolation: isolate !important;
                    }

                    .fc-scroller::-webkit-scrollbar {
                      width: 6px;
                      height: 6px;
                    }

                    @media (min-width: 640px) {
                      .fc-scroller::-webkit-scrollbar {
                        width: 10px;
                        height: 10px;
                      }
                    }

                    .fc-scroller::-webkit-scrollbar-track {
                      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                      border-radius: 4px;
                    }

                    .fc-scroller::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
                      border-radius: 4px;
                      border: 1px solid #f1f5f9;
                    }

                    @media (min-width: 640px) {
                      .fc-scroller::-webkit-scrollbar-thumb {
                        border-radius: 6px;
                        border: 2px solid #f1f5f9;
                      }
                    }

                    .fc-scroller::-webkit-scrollbar-thumb:hover {
                      background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
                    }
                      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
        @keyframes fadeTooltip {
  from { 
    opacity: 0; 
    transform: translate(-50%, -100%) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translate(-50%, -100%) scale(1); 
  }
}

.tooltip-animate {
  animation: fadeTooltip 0.15s ease-out forwards;
}
  .fc-daygrid-day.selected-date {
  position: relative;
}
.fc-daygrid-day.selected-date::after {
  content: "";
  position: absolute;
  top: 6px;
  right: 6px;
  bottom: 6px;
  left: 6px;
  border-radius: 50%;
  border: 2px solid #3b82f6; /* blue-500 */
}

.react-calendar {
  border: none;
  font-family: 'Inter', sans-serif;
  background: white;
  width: 100% !important;
}

.react-calendar__tile {
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  padding: 0.5em 0.3em;
}

@media (min-width: 640px) {
  .react-calendar__tile {
    border-radius: 8px;
    padding: 0.75em 0.5em;
  }
}

.react-calendar__tile--now {
  background: #e0f2fe;
  color: #0284c7;
  font-weight: bold;
}

.react-calendar__tile--active {
  background: #2563eb !important;
  color: white !important;
  border-radius: 6px !important;
}

@media (min-width: 640px) {
  .react-calendar__tile--active {
    border-radius: 8px !important;
  }
}

.has-event {
  position: relative;
}

.has-event::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #16a34a; /* green dot for event */
}

@media (min-width: 640px) {
  .has-event::after {
    bottom: 6px;
    width: 6px;
    height: 6px;
  }
}

/* Mobile event content adjustments */
.fc-event-time {
  font-size: 0.7rem !important;
  white-space: nowrap;
}

.fc-event-title {
  font-size: 0.7rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 640px) {
  .fc-event-time {
    font-size: 0.75rem !important;
  }
  
  .fc-event-title {
    font-size: 0.75rem !important;
  }
}


                  `}
                </style>
                <FullCalendar
                  key={calendarKey}
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  initialDate={new Date()}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  height="auto"
                  nowIndicator={true}
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  slotLabelInterval="00:30:00"
                  slotMinTime="09:00:00"
                  slotMaxTime="18:00:00"
                  slotEventOverlap={false}
                  eventOverlap={false}
                  selectOverlap={false}
                  eventMaxStack={1}
                  events={events}
                  eventClick={handleEventClick} 
                  dayMaxEventRows={true}
                  editable={true}
                  eventStartEditable={true}
                  eventDurationEditable={true}
                  eventDrop={handleEventDrop}
                  droppable={true}
                  eventMouseEnter={(info) => {
                    setHoveredEvent(info.event);
                    const rect = info.el.getBoundingClientRect();
                    const tooltipHeight = 100;
                    const spaceAbove = rect.top;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showBelow = spaceAbove < tooltipHeight && spaceBelow > tooltipHeight;

                    setTooltipPos({
                      x: rect.left + rect.width / 2,
                      y: showBelow ? rect.bottom + 10 : rect.top - 10,
                      showBelow: showBelow,
                    });
                  }}
                  eventMouseLeave={() => {
                    setHoveredEvent(null);
                    setTooltipPos(null);
                  }}
                  datesSet={handleDatesSet}
                  eventContent={(arg) => {
                    const status = arg.event.extendedProps.status;
                    let bgGradient = "";
                    let textColor = "text-white";
                    let iconComponent = null;
                    let borderColor = "";

                    if (status === "booked") {
                      bgGradient = "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)";
                      borderColor = "#ea580c";
                      iconComponent = <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />;
                    } else if (status === "completed") {
                      bgGradient = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                      borderColor = "#047857";
                      iconComponent = <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />;
                    } else {
                      bgGradient = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                      borderColor = "#b91c1c";
                      iconComponent = <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />;
                    }

                    return (
                      <div
                        className="h-full w-full rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 hover:brightness-110 hover:scale-[1.02] cursor-pointer"
                        style={{
                          background: bgGradient,
                          borderLeft: `3px solid ${borderColor}`,
                          boxSizing: "border-box",
                        }}
                      >
                        <div className={`h-full px-2 py-1.5 sm:px-3 sm:py-2.5 ${textColor}`}>
                          <div className="flex items-start gap-1 sm:gap-2 h-full">
                            {iconComponent}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="font-bold text-xs mb-0.5 sm:mb-1 leading-tight whitespace-nowrap">
                                {arg.timeText}
                              </div>
                              <div className="text-xs font-semibold leading-tight truncate">
                                {arg.event.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  slotLabelFormat={{
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }}
                  dayHeaderFormat={{
                    weekday: "short"
                  }}
                />
              </div>
              {hoveredEvent && tooltipPos && (
                <div
                  className="fixed z-50 bg-white text-gray-800 text-sm px-3 py-2 rounded-xl shadow-lg border border-gray-200 tooltip-animate hidden sm:block"
                  style={{
                    top: `${tooltipPos.y}px`,
                    left: `${tooltipPos.x}px`,
                    transform: tooltipPos.showBelow
                      ? "translate(-50%, 0)"
                      : "translate(-50%, -100%)",
                    pointerEvents: "none",
                    maxWidth: "300px",
                    willChange: "transform",
                  }}
                >
                  <div className="font-semibold">{hoveredEvent.title}</div>
                  <div className="text-gray-600">
                    {hoveredEvent.extendedProps.symptoms || "No symptoms"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(hoveredEvent.start).toLocaleString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              )}

              {popup && selectedEvent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[400px] relative animate-fadeIn">
                    <button
                      onClick={() => setPopup(false)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      Appointment Details
                    </h2>
                    <div className="space-y-2 text-gray-700">
                      <p>
                        <span className="font-semibold">Patient:</span>{" "}
                        {selectedEvent.title}
                      </p>
                      <p>
                        <span className="font-semibold">Symptoms:</span>{" "}
                        {selectedEvent.extendedProps.symptoms || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span>{" "}
                        <span
                          className={`capitalize font-semibold ${
                            selectedEvent.extendedProps.status === "booked"
                              ? "text-amber-600"
                              : selectedEvent.extendedProps.status ===
                                "completed"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedEvent.extendedProps.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Time:</span>{" "}
                        {new Date(selectedEvent.start).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p>
                        <span className="font-semibold">Rescheduled:</span>{" "}
                        <span className="text-purple-600 font-semibold">
                          {selectedEvent.extendedProps.rescheduleCount || 0} times
                        </span>
                      </p>
                    </div>
                    <div className="mt-6 flex gap-3 justify-end flex-wrap">
                      <button
                        onClick={() => {
                          toast.info("Reschedule feature coming soon!");
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:scale-105 transition-transform text-sm"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedEvent.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:scale-105 transition-transform text-sm"
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}