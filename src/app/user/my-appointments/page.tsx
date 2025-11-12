"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, FileText, Bell, MapPin, Phone, Edit3, Trash2, Search, User, ChevronDown, ChevronUp, BookOpen, Star, AlertCircle } from "lucide-react";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { useAuth } from "@/src/contexts/AuthContext";
import { useReports } from "@/src/contexts/ReportsContext";
import { Appointment, Doctor, Feedback} from "@/src/types";



export default function MyAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getReportsByPatient } = useReports();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "reminders" | "history"
  >("active");
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  
  // Feedback state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    doctorName: "",
    doctorId: "",
    prescriptionId: ""
  });

  // State for expanded appointment details
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set());

  // Get patient reports from ReportsContext
  const patientReports = user ? getReportsByPatient(user.name) : [];

  // Check if feedback can be edited/deleted (within 24 hours)
  const canEditDeleteFeedback = (feedback: Feedback) => {
    const feedbackDate = new Date(feedback.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Toggle appointment details
  const toggleAppointmentDetails = (appointmentId: string) => {
    setExpandedAppointments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  // Fetch user's appointments with auto-refresh
  const fetchAppointments = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/appointments?userId=${user.id}&t=${lastUpdated}`);
      const data = await res.json();
      
      const currentAppointments = JSON.stringify(appointments);
      const newAppointments = JSON.stringify(data.appointments || []);
      
      if (currentAppointments !== newAppointments) {
        setAppointments(data.appointments || []);
        console.log("Appointments updated automatically");
      }
    } catch (err) {
      console.error("Error fetching user appointments:", err);
    }
  };

  // Fetch feedback for appointments - LOCAL STORAGE SE
  const fetchFeedbacks = () => {
    try {
      const savedFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      setFeedbacks(savedFeedbacks);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;
    
    const initialFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/appointments?userId=${user.id}`);
        const data = await res.json();
        setAppointments(data.appointments || []);
        fetchFeedbacks(); // ✅ LOCAL STORAGE SE FEEDBACKS
      } catch (err) {
        console.error("Error fetching user appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    
    initialFetch();
  }, [user]);

  // Auto-refresh appointments every 3 seconds
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchAppointments();
      fetchFeedbacks(); // ✅ AUTO REFRESH FEEDBACKS
    }, 3000);

    return () => clearInterval(interval);
  }, [user, lastUpdated, appointments]);

  // Manual refresh function
  const handleManualRefresh = () => {
    setLastUpdated(Date.now());
    fetchAppointments();
    fetchFeedbacks();
  };

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors");
        const data = await res.json();
        setDoctors(data.doctors || data || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch prescriptions with auto-refresh
  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`/api/prescriptions?t=${lastUpdated}`);
      const data = await res.json();
      
      const currentPrescriptions = JSON.stringify(prescriptions);
      const newPrescriptions = JSON.stringify(data.prescriptions || []);
      
      if (currentPrescriptions !== newPrescriptions) {
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [lastUpdated]);

  // Improved filter logic with search functionality
  useEffect(() => {
    if (!appointments.length || !doctors.length) return;

    let filtered = appointments.filter((a) => {
      if (activeTab === "active") return a.status === "booked";
      if (activeTab === "completed") return a.status === "completed";
      if (activeTab === "reminders") {
        if (a.status !== "completed") return false;
        const pres = prescriptions.find((p) => p.appointmentId === a.id);
        return pres?.followUp;
      }
      if (activeTab === "history") {
        return a.status === "completed" || a.status === "cancelled";
      }
      return false;
    });

    // Apply search filters for history tab
    if (activeTab === "history" && (searchTerm || searchFilters.doctorName || searchFilters.doctorId || searchFilters.prescriptionId)) {
      filtered = filtered.filter((a) => {
        const doctor = doctors.find((d) => d.id === a.doctorId);
        const prescription = prescriptions.find((p) => p.appointmentId === a.id);
        
        // Search by general term across multiple fields
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesDoctorName = doctor?.name?.toLowerCase().includes(term);
          const matchesSpecialization = doctor?.specialization?.toLowerCase().includes(term);
          const matchesSymptoms = a.symptoms?.toLowerCase().includes(term);
          const matchesPrescriptionId = prescription?.id?.toLowerCase().includes(term);
          
          return matchesDoctorName || matchesSpecialization || matchesSymptoms || matchesPrescriptionId;
        }

        // Search by specific filters
        if (searchFilters.doctorName && !doctor?.name?.toLowerCase().includes(searchFilters.doctorName.toLowerCase())) {
          return false;
        }
        if (searchFilters.doctorId && a.doctorId !== searchFilters.doctorId) {
          return false;
        }
        if (searchFilters.prescriptionId && prescription?.id !== searchFilters.prescriptionId) {
          return false;
        }

        return true;
      });
    }

    // Map appointments with doctor and prescription data
    const mappedAppointments = filtered.map((a) => {
      const doctor = doctors.find((d) => d.id === a.doctorId);
      const prescription = prescriptions.find((p) => p.appointmentId === a.id);
      const feedback = feedbacks.find((f) => f.appointmentId === a.id);
      return { ...a, doctor, prescription, feedback };
    });

    setFilteredAppointments(mappedAppointments);
  }, [appointments, doctors, prescriptions, activeTab, searchTerm, searchFilters, feedbacks]);

  // Search handler functions
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all search filters
  const clearSearchFilters = () => {
    setSearchTerm("");
    setSearchFilters({
      doctorName: "",
      doctorId: "",
      prescriptionId: ""
    });
  };

  // Edit follow-up date function
  const handleEditFollowUp = async (prescriptionId: string) => {
    if (!newFollowUpDate) return;

    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followUp: newFollowUpDate,
        }),
      });

      if (res.ok) {
        setPrescriptions(prev =>
          prev.map(pres =>
            pres.id === prescriptionId
              ? { ...pres, followUp: newFollowUpDate }
              : pres
          )
        );
        
        setLastUpdated(Date.now());
        setEditingReminder(null);
        setNewFollowUpDate("");
        alert("Follow-up date updated successfully!");
      }
    } catch (error) {
      console.error("Error updating follow-up date:", error);
      alert("Error updating follow-up date");
    }
  };

  // Delete reminder function
  const handleDeleteReminder = async (prescriptionId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPrescriptions(prev =>
          prev.map(pres =>
            pres.id === prescriptionId
              ? { ...pres, followUp: null }
              : pres
          )
        );
        
        setLastUpdated(Date.now());
        alert("Reminder deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      alert("Error deleting reminder");
    }
  };

  // Start editing function
  const startEditing = (prescriptionId: string, currentFollowUp: string) => {
    setEditingReminder(prescriptionId);
    setNewFollowUpDate(currentFollowUp.split('T')[0]);
  };

  // Cancel editing function
  const cancelEditing = () => {
    setEditingReminder(null);
    setNewFollowUpDate("");
  };

  // Feedback functions
  const openFeedbackModal = (appointment: any, feedback?: Feedback) => {
    setSelectedAppointment(appointment);
    if (feedback) {
      setEditingFeedback(feedback);
      setFeedbackRating(feedback.rating);
      setFeedbackMessage(feedback.message);
    } else {
      setEditingFeedback(null);
      setFeedbackRating(0);
      setFeedbackMessage("");
    }
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedAppointment(null);
    setEditingFeedback(null);
    setFeedbackRating(0);
    setFeedbackMessage("");
  };

  const submitFeedback = async () => {
    if (!selectedAppointment || !user?.id || feedbackRating === 0) return;

    setSubmittingFeedback(true);
    try {
      // ✅ UPDATED: LOCAL STORAGE SOLUTION WITH PATIENT NAME & DOCTOR ID
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newFeedback = {
        id: `feedback-${Date.now()}`,
        appointmentId: selectedAppointment.id,
        patientId: user.id,
        patientName: user.name, // ✅ ADDED PATIENT NAME
        doctorId: selectedAppointment.doctorId, // ✅ ADDED DOCTOR ID
        rating: feedbackRating,
        message: feedbackMessage,
        createdAt: new Date().toISOString()
      };
      
      // Store in local storage
      const existingFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      let updatedFeedbacks;
      
      if (editingFeedback) {
        updatedFeedbacks = existingFeedbacks.map((f: Feedback) => 
          f.id === editingFeedback.id ? newFeedback : f
        );
      } else {
        updatedFeedbacks = [...existingFeedbacks, newFeedback];
      }
      
      localStorage.setItem('feedbacks', JSON.stringify(updatedFeedbacks));
      setFeedbacks(updatedFeedbacks);
      
      closeFeedbackModal();
      alert(editingFeedback ? 'Feedback updated successfully!' : 'Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const deleteFeedback = async (feedback: Feedback) => {
    if (!canEditDeleteFeedback(feedback)) {
      alert('Feedback can only be deleted within 24 hours of submission.');
      return;
    }

    if (!confirm('Are you sure you want to delete your feedback?')) return;

    try {
      // ✅ UPDATED: LOCAL STORAGE SOLUTION
      const existingFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      const updatedFeedbacks = existingFeedbacks.filter((f: Feedback) => f.id !== feedback.id);
      
      localStorage.setItem('feedbacks', JSON.stringify(updatedFeedbacks));
      setFeedbacks(updatedFeedbacks);
      
      alert('Feedback deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Error deleting feedback');
    }
  };

  // Calculate time remaining for edit/delete
  const getTimeRemaining = (feedback: Feedback) => {
    const feedbackDate = new Date(feedback.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursDiff;
    
    if (hoursRemaining <= 0) return null;
    
    if (hoursRemaining >= 1) {
      return `${Math.floor(hoursRemaining)}h ${Math.round((hoursRemaining % 1) * 60)}m remaining`;
    } else {
      return `${Math.round(hoursRemaining * 60)}m remaining`;
    }
  };

  // Star rating component
  const StarRating = ({ rating, onRatingChange, editable = false }: { rating: number; onRatingChange?: (rating: number) => void; editable?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => editable && onRatingChange?.(star)}
            className={`${editable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            disabled={!editable}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Feedback Modal */}
      {showFeedbackModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingFeedback ? 'Edit Your Feedback' : 'Rate Your Experience'}
            </h3>
            
            {editingFeedback && !canEditDeleteFeedback(editingFeedback) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">Editing time expired</p>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Feedback can only be edited within 24 hours of submission.
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedAppointment.doctor?.profileImage || "/doctor-placeholder.png"}
                  alt={selectedAppointment.doctor?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Dr. {selectedAppointment.doctor?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.doctor?.specialization}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How would you rate your experience?
                </label>
                <StarRating 
                  rating={feedbackRating} 
                  onRatingChange={setFeedbackRating}
                  editable={!editingFeedback || canEditDeleteFeedback(editingFeedback)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback (Optional)
                </label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Share your experience with the doctor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-700"
                  rows={4}
                  disabled={editingFeedback ? !canEditDeleteFeedback(editingFeedback) : false}
                />
              </div>

              {editingFeedback && canEditDeleteFeedback(editingFeedback) && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">
                    ⏰ {getTimeRemaining(editingFeedback)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    You can edit or delete your feedback within 24 hours of submission.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeFeedbackModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={feedbackRating === 0 || submittingFeedback || (editingFeedback ? !canEditDeleteFeedback(editingFeedback) : false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submittingFeedback ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {editingFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              My Appointments
            </h1>
            <p className="text-gray-600">Manage and track your healthcare appointments</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {["active", "completed", "reminders", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300"
                }`}
              >
                {tab === "active" && "Active"}
                {tab === "completed" && "Completed"}
                {tab === "reminders" && "Reminders"}
                {tab === "history" && "History"}
              </button>
            ))}
          </div>

          {/* SEARCH SECTION FOR HISTORY TAB */}
          {activeTab === "history" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                {/* General Search */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Appointments
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by doctor name, specialization, symptoms..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700"
                    />
                  </div>
                </div>

                {/* Doctor Name Filter */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by doctor name..."
                    value={searchFilters.doctorName}
                    onChange={(e) => handleFilterChange('doctorName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700"
                  />
                </div>

                {/* Doctor ID Filter */}
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor ID
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by doctor ID..."
                    value={searchFilters.doctorId}
                    onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700"
                  />
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearSearchFilters}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>

              {/* Search Results Info */}
              {(searchTerm || searchFilters.doctorName || searchFilters.doctorId || searchFilters.prescriptionId) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Showing {filteredAppointments.length} results for your search
                    {searchTerm && ` • Search: "${searchTerm}"`}
                    {searchFilters.doctorName && ` • Doctor: "${searchFilters.doctorName}"`}
                    {searchFilters.doctorId && ` • Doctor ID: "${searchFilters.doctorId}"`}
                    {searchFilters.prescriptionId && ` • Prescription ID: "${searchFilters.prescriptionId}"`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Appointment cards - Grid Layout */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-blue-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">
                {activeTab === "history" && (searchTerm || searchFilters.doctorName || searchFilters.doctorId || searchFilters.prescriptionId) 
                  ? "No appointments match your search"
                  : "No appointments found"
                }
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {activeTab === "history" && (searchTerm || searchFilters.doctorName || searchFilters.doctorId || searchFilters.prescriptionId)
                  ? "Try adjusting your search filters"
                  : `You currently have no ${activeTab} appointments.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAppointments.map((a) => {
                const doctor = a.doctor;
                const prescription = a.prescription;
                const feedback = a.feedback;
                const isExpanded = expandedAppointments.has(a.id);
                
                // Get medical reports for this doctor from ReportsContext
                const doctorReports = patientReports.filter(
                  report => report.doctorId === a.doctorId
                );

                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden group"
                  >
                    {/* SIMPLE CARD DESIGN FOR HISTORY TAB */}
                    {activeTab === "history" ? (
                      <div className="p-6">
                        {/* Simple Header with Doctor Name and Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-gray-800">
                                {doctor?.name || "Doctor"}
                              </h2>
                              <p className="text-sm text-blue-600 font-medium">
                                {doctor?.specialization || "General Practitioner"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                              a.status === "completed"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>

                        {/* Basic Appointment Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">
                              {new Date(a.date).toLocaleDateString("en-IN", {
                                dateStyle: "medium",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">{a.time}</span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={() => toggleAppointmentDetails(a.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg mb-3"
                        >
                          <span>View Details</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {/* Expanded Details Section */}
                        {isExpanded && (
                          <div className="bg-gray-50 rounded-xl p-4 space-y-4 animate-fadeIn">
                            {/* Doctor Details */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2">Doctor Information</h3>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Doctor ID:</span>
                                  <span className="font-mono text-gray-800">{a.doctorId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Specialization:</span>
                                  <span className="text-blue-600 font-medium">{doctor?.specialization}</span>
                                </div>
                                {doctor?.experience && (
                                  <div className="flex justify-between">
                                    <span>Experience:</span>
                                    <span>{doctor.experience}</span>
                                  </div>
                                )}
                                {doctor?.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs">{doctor.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Appointment Details */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2">Appointment Details</h3>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Appointment ID:</span>
                                  <span className="font-mono text-gray-800">{a.id}</span>
                                </div>
                                {prescription?.id && (
                                  <div className="flex justify-between">
                                    <span>Prescription ID:</span>
                                    <span className="font-mono text-gray-800">{prescription.id}</span>
                                  </div>
                                )}
                                {a.symptoms && (
                                  <div>
                                    <span className="block mb-1">Symptoms:</span>
                                    <p className="text-gray-700 bg-white p-2 rounded-lg border text-xs">
                                      {a.symptoms}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* MEDICAL REPORTS SECTION */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2">Medical Reports</h3>
                              {doctorReports.length === 0 ? (
                                <p className="text-sm text-gray-500">No medical reports found</p>
                              ) : (
                                <div className="space-y-3">
                                  {doctorReports.map((report) => (
                                    <div key={report.id} className="bg-white p-3 rounded-lg border">
                                      <p className="font-medium text-gray-900">{report.diagnosis}</p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {new Date(report.date).toLocaleDateString('en-IN')}
                                      </p>
                                      <div className="mt-2 text-xs text-gray-700">
                                        {report.medicines.slice(0, 2).map(med => med.name).join(', ')}
                                        {report.medicines.length > 2 && ` +${report.medicines.length - 2} more`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Report Button - Always visible for completed appointments */}
                        {a.status === "completed" && (
                          <button
                            onClick={() =>
                              router.push(
                                `/user/reports/${
                                  a.id
                                }?doctorName=${encodeURIComponent(
                                  doctor?.name || ""
                                )}&doctorImage=${encodeURIComponent(
                                  doctor?.profileImage || ""
                                )}&specialization=${encodeURIComponent(
                                  doctor?.specialization || ""
                                )}`
                              )
                            }
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg mt-3"
                          >
                            <FileText className="w-4 h-4" /> View Report
                          </button>
                        )}
                      </div>
                    ) : (
                      // ORIGINAL CARD DESIGN FOR OTHER TABS (COMPLETED TAB WITH FEEDBACK)
                      <>
                        {/* Card Header with Doctor Info */}
                        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 pb-20">
                          <div className="absolute top-4 right-4">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-lg ${
                                a.status === "completed"
                                  ? "bg-green-500 text-white"
                                  : a.status === "cancelled"
                                  ? "bg-red-500 text-white"
                                  : "bg-yellow-400 text-gray-900"
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          
                          {/* Doctor Image - Overlapping design */}
                          <div className="absolute -bottom-12 left-6">
                            <div className="relative">
                              <img
                                src={doctor?.profileImage || "/doctor-placeholder.png"}
                                alt={doctor?.name || "Doctor"}
                                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="pt-16 px-6 pb-6">
                          <h2 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1">
                            {doctor?.name || "Doctor"}
                          </h2>
                          <p className="text-sm text-blue-600 font-medium mb-4">
                            {doctor?.specialization || "General Practitioner"}
                          </p>

                          {/* Appointment Details */}
                          <div className="space-y-3 mb-4">
                            {activeTab !== "reminders" ? (
                              <>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="font-medium">
                                    {new Date(a.date).toLocaleDateString("en-IN", {
                                      dateStyle: "medium",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="font-medium">{a.time}</span>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span>
                                    Previous: {new Date(a.date).toLocaleDateString("en-IN", {
                                      dateStyle: "medium",
                                    })}
                                  </span>
                                </div>
                                {prescription?.followUp && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-amber-600 font-semibold uppercase mb-1">
                                          Follow-up Reminder
                                        </p>
                                        {editingReminder === prescription.id ? (
                                          // Edit Mode
                                          <div className="space-y-3">
                                            <div>
                                              <label className="block text-xs text-gray-600 mb-1 font-medium">
                                                New Follow-up Date
                                              </label>
                                              <input
                                                type="date"
                                                value={newFollowUpDate}
                                                onChange={(e) => setNewFollowUpDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                                              />
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleEditFollowUp(prescription.id)}
                                                disabled={!newFollowUpDate}
                                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                              >
                                                <Edit3 className="w-3 h-3" />
                                                Save
                                              </button>
                                              <button
                                                onClick={cancelEditing}
                                                className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          // View Mode
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="text-sm text-amber-700 font-semibold">
                                                  {new Date(prescription.followUp).toLocaleDateString(
                                                    "en-IN",
                                                    { 
                                                      weekday: 'short',
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric'
                                                    }
                                                  )}
                                                </p>
                                                <p className="text-xs text-amber-600 mt-1">
                                                  {new Date(prescription.followUp) > new Date() 
                                                    ? 'Upcoming appointment' 
                                                    : 'Past due date'}
                                                </p>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => startEditing(prescription.id, prescription.followUp)}
                                                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                  title="Edit reminder"
                                                >
                                                  <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteReminder(prescription.id)}
                                                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                  title="Delete reminder"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                            <div className="pt-2 border-t border-amber-200">
                                              <p className="text-xs text-gray-500">
                                                Set by Dr. {doctor?.name || "your doctor"}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {a.symptoms && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                                Symptoms
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {a.symptoms}
                              </p>
                            </div>
                          )}

                          {/* FEEDBACK SECTION - Only for completed appointments in COMPLETED TAB */}
                          {activeTab === "completed" && a.status === "completed" && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-700">
                                  Your Feedback
                                </h4>
                                {feedback && canEditDeleteFeedback(feedback) && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openFeedbackModal(a, feedback)}
                                      className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteFeedback(feedback)}
                                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {feedback ? (
                                <div className="space-y-2">
                                  <StarRating rating={feedback.rating} />
                                  {feedback.message && (
                                    <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                      "{feedback.message}"
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                      Submitted on {new Date(feedback.createdAt).toLocaleDateString()}
                                    </p>
                                    {canEditDeleteFeedback(feedback) && (
                                      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {getTimeRemaining(feedback)}
                                      </div>
                                    )}
                                  </div>
                                  {!canEditDeleteFeedback(feedback) && (
                                    <div className="bg-gray-100 p-2 rounded border border-gray-200">
                                      <p className="text-xs text-gray-600 text-center">
                                        ⏰ Editing time expired
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => openFeedbackModal(a)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                                >
                                  <Star className="w-4 h-4" />
                                  Rate Your Experience
                                </button>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          {activeTab === "completed" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/user/reports/${
                                    a.id
                                  }?doctorName=${encodeURIComponent(
                                    doctor?.name || ""
                                  )}&doctorImage=${encodeURIComponent(
                                    doctor?.profileImage || ""
                                  )}&specialization=${encodeURIComponent(
                                    doctor?.specialization || ""
                                  )}`
                                )
                              }
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <FileText className="w-4 h-4" /> View Report
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}