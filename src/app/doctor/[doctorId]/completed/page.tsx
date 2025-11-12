"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { Appointment, Prescription } from "@/src/types";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Pill,
  FileText,
  ArrowLeft,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function CompletedAppointments() {
  const { doctorId } = useParams();
  const [completedAppointments, setCompletedAppointments] = useState<
    Appointment[]
  >([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] =
    useState(false);
  const [showUpdatePrescriptionModal, setShowUpdatePrescriptionModal] =
    useState(false);
  const [prescriptionData, setPrescriptionData] = useState<
    Partial<Prescription>
  >({});
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] =
    useState<Prescription | null>(null);

  const fetchCompletedAppointments = async () => {
    try {
      const res = await fetch(
        `/api/appointments?doctorId=${doctorId}&status=completed`
      );
      const data = await res.json();
      if (data.appointments) {
        setCompletedAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error fetching completed appointments:", err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (data.success) setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    }
  };

  useEffect(() => {
    if (doctorId) {
      setLoading(true);
      Promise.all([fetchCompletedAppointments(), fetchPrescriptions()]).finally(
        () => setLoading(false)
      );
    }
  }, [doctorId]);

  // Handle update button click - prefill prescriptionData correctly
  const handleUpdateClick = (appointment: Appointment) => {
    const existingPrescription = prescriptions.find(
      (p) => p.appointmentId === appointment.id
    );
    if (existingPrescription) {
      setSelectedAppointment(appointment);
      setPrescriptionData(existingPrescription);
      setShowUpdatePrescriptionModal(true);
    } else {
      toast.error("No prescription available to update");
    }
  };

  const handleDeletePrescription = async (appointment: Appointment) => {
    const existingPrescription = prescriptions.find(
      (p) => p.appointmentId === appointment.id
    );
    if (!existingPrescription) {
      toast.error("No prescription found to delete");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prescription?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/prescriptions/${existingPrescription.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Prescription deleted successfully");
        fetchPrescriptions(); // Refresh list
      } else {
        toast.error(data.error || "Failed to delete prescription");
      }
    } catch (err) {
      toast.error("Failed to delete prescription");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading completed appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/doctor/${doctorId}`}
            className="p-2 bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Completed Appointments
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage your completed consultations
            </p>
          </div>
        </div>

        {completedAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-900 font-bold text-xl mb-2">
              No completed appointments
            </p>
            <p className="text-sm text-gray-500">
              Completed appointments will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {completedAppointments.map((appointment) => {
              const existingPrescription = prescriptions.find(
                (p) => p.appointmentId === appointment.id
              );

              return (
                <div
                  key={appointment.id}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wide shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          completed
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">
                            {appointment.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">
                            {new Date(appointment.date).toLocaleDateString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-sm opacity-50"></div>
                          <div className="relative w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {appointment.patientName}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                              <User className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold">
                                {appointment.patientAge} years
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {appointment.symptoms && (
                        <div className="mt-5 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                          <p className="text-sm text-gray-700 italic">
                            "{appointment.symptoms}"
                          </p>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowViewPrescriptionModal(true);
                          }}
                          className="group/btn relative"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <FileText className="w-4 h-4" />
                            View Prescription
                          </div>
                        </button>

                        <button
                          onClick={() => handleUpdateClick(appointment)}
                          className="group/btn relative"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            Update
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            const existingPrescription = prescriptions.find(
                              (p) => p.appointmentId === appointment.id
                            );
                            if (existingPrescription) {
                              setPrescriptionToDelete(existingPrescription);
                              setShowDeleteConfirmModal(true);
                            } else {
                              toast.error("No prescription found to delete");
                            }
                          }}
                          className="group/btn relative"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            Delete
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Prescription Modal - UPDATED VERSION */}
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

              {/* Medicines - COMPLETELY UPDATED */}
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
                        {/* Medicine Name & Type */}
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

                        {/* Medicine Details - Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {/* Duration */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-700">
                              <strong>Duration:</strong> {medicine.duration || medicine.days || 'Not specified'}
                            </span>
                          </div>

                          {/* Frequency */}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">
                              <strong>Frequency:</strong> {medicine.frequency || (medicine.timesPerDay ? `${medicine.timesPerDay} times/day` : 'Not specified')}
                            </span>
                          </div>

                          {/* Additional Instructions */}
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
      {showDeleteConfirmModal && prescriptionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this prescription?
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/prescriptions/${prescriptionToDelete.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Prescription deleted successfully");
                      fetchPrescriptions();
                    } else {
                      toast.error(
                        data.error || "Failed to delete prescription"
                      );
                    }
                  } catch {
                    toast.error("Failed to delete prescription");
                  } finally {
                    setShowDeleteConfirmModal(false);
                    setPrescriptionToDelete(null);
                  }
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Prescription Modal */}
      {/* Update Prescription Modal - UPDATED VERSION */}
{showUpdatePrescriptionModal && selectedAppointment && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl border border-white/50 max-h-[90vh] overflow-y-auto p-8">
      <h3 className="text-xl font-bold mb-6 text-gray-900">
        Update Prescription for {selectedAppointment.patientName}
      </h3>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!prescriptionData.id) {
            toast.error("Prescription ID missing");
            return;
          }
          
          // Prepare data with all medicine fields
          const updateData = {
            ...prescriptionData,
            medicines: (prescriptionData.medicines || []).map(med => ({
              name: med.name,
              type: med.type || 'Tablet',
              dosage: med.dosage || '',
              duration: med.duration || med.days || '',
              frequency: med.frequency || med.timesPerDay || '',
              instructions: med.instructions || '',
              // Keep old fields for compatibility
              days: med.days || med.duration || '',
              timesPerDay: med.timesPerDay || med.frequency || ''
            }))
          };

          const res = await fetch(
            `/api/prescriptions/${prescriptionData.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updateData),
            }
          );
          const data = await res.json();
          if (data.success) {
            toast.success("Prescription updated successfully");
            setShowUpdatePrescriptionModal(false);
            fetchPrescriptions();
          } else {
            toast.error(data.error || "Failed to update prescription");
          }
        }}
      >
        {/* Diagnosis */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Diagnosis *
          </label>
          <textarea
            value={prescriptionData.diagnosis || ""}
            onChange={(e) =>
              setPrescriptionData({
                ...prescriptionData,
                diagnosis: e.target.value,
              })
            }
            placeholder="Enter diagnosis..."
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-700"
            rows={3}
            required
          />
        </div>

        {/* Medicines - UPDATED WITH ALL FIELDS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-gray-700">
              Medicines *
            </label>
            <button
              type="button"
              onClick={() => {
                const medicines = prescriptionData.medicines
                  ? [...prescriptionData.medicines]
                  : [];
                medicines.push({ 
                  name: "", 
                  type: "Tablet", 
                  dosage: "", 
                  duration: "", 
                  frequency: "",
                  instructions: "",
                  days: "",
                  timesPerDay: ""
                });
                setPrescriptionData({ ...prescriptionData, medicines });
              }}
              className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(prescriptionData.medicines || []).map((medicine, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  {/* Medicine Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Paracetamol"
                      value={medicine.name}
                      onChange={(e) => {
                        const medicines = [...(prescriptionData.medicines || [])];
                        medicines[index].name = e.target.value;
                        setPrescriptionData({ ...prescriptionData, medicines });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                      required
                    />
                  </div>

                  {/* Medicine Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Type
                    </label>
                    <select
                      value={medicine.type || "Tablet"}
                      onChange={(e) => {
                        const medicines = [...(prescriptionData.medicines || [])];
                        medicines[index].type = e.target.value;
                        setPrescriptionData({ ...prescriptionData, medicines });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                    </select>
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg, 5ml"
                      value={medicine.dosage || ""}
                      onChange={(e) => {
                        const medicines = [...(prescriptionData.medicines || [])];
                        medicines[index].dosage = e.target.value;
                        setPrescriptionData({ ...prescriptionData, medicines });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 5 days, 1 week"
                      value={medicine.duration || medicine.days || ""}
                      onChange={(e) => {
                        const medicines = [...(prescriptionData.medicines || [])];
                        medicines[index].duration = e.target.value;
                        medicines[index].days = e.target.value; // For compatibility
                        setPrescriptionData({ ...prescriptionData, medicines });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Twice daily, After meals"
                      value={medicine.frequency || medicine.timesPerDay || ""}
                      onChange={(e) => {
                        const medicines = [...(prescriptionData.medicines || [])];
                        medicines[index].frequency = e.target.value;
                        medicines[index].timesPerDay = e.target.value; // For compatibility
                        setPrescriptionData({ ...prescriptionData, medicines });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="flex items-end">
                    {(prescriptionData.medicines || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const medicines = [...(prescriptionData.medicines || [])];
                          medicines.splice(index, 1);
                          setPrescriptionData({ ...prescriptionData, medicines });
                        }}
                        className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Instructions */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Additional Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., After food, Avoid dairy, etc."
                    value={medicine.instructions || ""}
                    onChange={(e) => {
                      const medicines = [...(prescriptionData.medicines || [])];
                      medicines[index].instructions = e.target.value;
                      setPrescriptionData({ ...prescriptionData, medicines });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advice */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Advice
          </label>
          <textarea
            value={prescriptionData.advice || ""}
            onChange={(e) =>
              setPrescriptionData({
                ...prescriptionData,
                advice: e.target.value,
              })
            }
            placeholder="Enter advice for patient..."
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-700"
            rows={2}
          />
        </div>

        {/* Follow-up */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Follow-up Date
          </label>
          <input
            type="date"
            value={prescriptionData.followUp || ""}
            onChange={(e) =>
              setPrescriptionData({
                ...prescriptionData,
                followUp: e.target.value,
              })
            }
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-700"
          />
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => setShowUpdatePrescriptionModal(false)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105 text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
