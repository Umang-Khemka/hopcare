"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useReports } from "@/src/contexts/ReportsContext";
import { Appointment, Doctor } from "@/src/types";
import { toast } from "react-toastify";

const PrescriptionPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { doctorId, appointmentId } = useParams();
  const { addReport } = useReports();

  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Medicine type options
  const medicineTypes = [
    "Tablet", "Capsule", "Syrup", "Injection", "Ointment", 
    "Drops", "Inhaler", "Spray", "Cream", "Gel"
  ];

  // Duration options
  const durationOptions = [
    "1 day", "2 days", "3 days", "5 days", "7 days", "10 days", 
    "14 days", "21 days", "30 days", "45 days", "60 days", "90 days",
    "As needed", "Until finished"
  ];

  // Frequency options
  const frequencyOptions = [
    "Once daily", "Twice daily", "Thrice daily", "Four times daily",
    "Every 6 hours", "Every 8 hours", "Every 12 hours",
    "Before meals", "After meals", "With meals",
    "At bedtime", "When required", "Weekly", "Monthly"
  ];

  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: "",
    medicines: [{ 
      name: "", 
      type: "Tablet", 
      dosage: "", 
      duration: "5 days", 
      frequency: "Twice daily",
      instructions: "" 
    }],
    tests: [],
    advice: "",
    followUp: "",
  });

  // Fetch doctor details
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
  }, [doctorId]);

  // Fetch appointment details (which includes patient info)
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      try {
        // First try to get from today's appointments
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/api/appointments?doctorId=${doctorId}&date=${today}`);
        const data = await res.json();
        
        if (data.appointments) {
          const foundAppointment = data.appointments.find(
            (a: Appointment) => a.id === appointmentId
          );
          
          if (foundAppointment) {
            setAppointment(foundAppointment);
            setLoading(false);
            return;
          }
        }

        // If not found in today's appointments, try general appointments API
        const generalRes = await fetch(`/api/appointments?id=${appointmentId}`);
        const generalData = await generalRes.json();
        
        if (generalData.appointment) {
          setAppointment(generalData.appointment);
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [appointmentId, doctorId]);

  // Medicine management functions
  const addMedicine = () => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: [
        ...prescriptionData.medicines,
        { 
          name: "", 
          type: "Tablet", 
          dosage: "", 
          duration: "5 days", 
          frequency: "Twice daily",
          instructions: "" 
        },
      ],
    });
  };

  const removeMedicine = (index: number) => {
    const newMedicines = prescriptionData.medicines.filter((_, i) => i !== index);
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

  const handleSavePrescription = async () => {
    if (!prescriptionData.diagnosis.trim()) {
      toast.error("Please enter diagnosis");
      return;
    }

    // Check if at least one medicine has name
    const hasValidMedicine = prescriptionData.medicines.some(
      (med) => med.name.trim() !== ""
    );

    if (!hasValidMedicine) {
      toast.error("Please add at least one medicine");
      return;
    }

    setSaving(true);

    try {
      console.log("🟡 CLIENT: Starting prescription save process...");
      
      // ✅ FIRST: Create medical report data
      const medicalReport = {
        id: `report_${Date.now()}`,
        appointmentId: appointmentId as string,
        doctorId: doctorId as string,
        doctorName: doctorInfo?.name || 'Unknown Doctor',
        patientName: appointment?.patientName || 'Unknown Patient',
        date: new Date().toISOString(),
        diagnosis: prescriptionData.diagnosis,
        medicines: prescriptionData.medicines.filter(med => med.name.trim() !== ""),
        advice: prescriptionData.advice,
        followUp: prescriptionData.followUp,
        createdAt: new Date().toISOString()
      };
      
      console.log("🟡 CLIENT: Medical Report Data Prepared:", medicalReport);

      // ✅ SECOND: Add to ReportsContext FIRST (before API call)
      if (addReport && typeof addReport === 'function') {
        console.log("🟡 CLIENT: addReport function available, calling it...");
        addReport(medicalReport);
        console.log("✅ CLIENT: Report added to context!");
        
        // Verify it's in localStorage
        setTimeout(() => {
          const storedReports = localStorage.getItem('medicalReports');
          console.log("🟡 CLIENT: localStorage verification:", storedReports ? JSON.parse(storedReports).length + " reports" : "No reports");
        }, 100);
      } else {
        console.error("❌ CLIENT: addReport is not available or not a function");
        console.log("🟡 CLIENT: addReport value:", addReport);
        
        // Fallback: Save directly to localStorage
        console.log("🟡 CLIENT: Using localStorage fallback...");
        const existingReports = JSON.parse(localStorage.getItem('medicalReports') || '[]');
        const updatedReports = [...existingReports, medicalReport];
        localStorage.setItem('medicalReports', JSON.stringify(updatedReports));
        console.log("✅ CLIENT: Report saved to localStorage directly");
      }

      // ✅ THIRD: Make API call to save prescription
      console.log("🟡 CLIENT: Making API call to save prescription...");
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          diagnosis: prescriptionData.diagnosis,
          medicines: prescriptionData.medicines.filter(med => med.name.trim() !== ""),
          advice: prescriptionData.advice,
          followUp: prescriptionData.followUp,
        }),
      });

      const data = await res.json();
      console.log("🟡 CLIENT: API Response received:", data);

      if (data.success) {
        console.log("✅ CLIENT: Prescription saved successfully to API!");
        
        // Final verification
        setTimeout(() => {
          const finalReports = localStorage.getItem('medicalReports');
          if (finalReports) {
            const reports = JSON.parse(finalReports);
            console.log(`✅ CLIENT: FINAL - ${reports.length} reports in storage`);
            console.log("📋 CLIENT: All reports:", reports);
          }
        }, 500);
        
        toast.success("Prescription saved successfully!");
        
        // Redirect to doctor dashboard
        setTimeout(() => {
          router.push(`/doctor/${doctorId}`);
        }, 2000);
      } else {
        console.error("❌ CLIENT: API returned success: false");
        toast.error("Failed to save prescription to database");
      }
    } catch (err) {
      console.error("❌ CLIENT: Error in prescription save:", err);
      toast.error("Failed to save prescription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Prescription</h1>
          <p className="text-gray-600 mt-2">Create professional prescription</p>
        </div>

        {/* Doctor & Patient Info Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Info */}
            <div className="border-r pr-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h3>
              {doctorInfo && (
                <div className="space-y-2">
                  <p className="text-gray-800"><strong>Name:</strong> Dr. {doctorInfo.name}</p>
                  <p className="text-gray-800"><strong>Specialization:</strong> {doctorInfo.specialization}</p>
                  <p className="text-gray-800"><strong>Experience:</strong> {doctorInfo.experience}</p>
                  <p className="text-gray-800"><strong>Location:</strong> {doctorInfo.location || "City Hospital"}</p>
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              {appointment && (
                <div className="space-y-2">
                  <p className="text-gray-800"><strong>Name:</strong> {appointment.patientName}</p>
                  <p className="text-gray-800"><strong>Age:</strong> {appointment.patientAge} years</p>
                  <p className="text-gray-800"><strong>Appointment Date:</strong> {new Date(appointment.date).toLocaleDateString('en-IN')}</p>
                  <p className="text-gray-800"><strong>Time:</strong> {appointment.time}</p>
                  {appointment.symptoms && (
                    <p className="text-gray-800"><strong>Symptoms:</strong> {appointment.symptoms}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prescription Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
            PRESCRIPTION
          </h3>

          {/* Diagnosis */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis *
            </label>
            <textarea
              value={prescriptionData.diagnosis}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
              placeholder="Enter diagnosis..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              rows={3}
            />
          </div>

          {/* Medicines */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Medicines *
              </label>
              <button
                onClick={addMedicine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <span>+</span> Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {prescriptionData.medicines.map((medicine, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Medicine Name */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Paracetamol"
                        value={medicine.name}
                        onChange={(e) => updateMedicine(index, "name", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                      />
                    </div>

                    {/* Medicine Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={medicine.type}
                        onChange={(e) => updateMedicine(index, "type", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                      >
                        {medicineTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
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
                        value={medicine.dosage}
                        onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Duration
                      </label>
                      <select
                        value={medicine.duration}
                        onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                      >
                        {durationOptions.map(duration => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Frequency
                      </label>
                      <select
                        value={medicine.frequency}
                        onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700" 
                      >
                        {frequencyOptions.map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      {prescriptionData.medicines.length > 1 && (
                        <button
                          onClick={() => removeMedicine(index)}
                          className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center justify-center gap-1"
                        >
                          <span>✕</span> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional Instructions */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Additional Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., After food, Avoid dairy, etc."
                      value={medicine.instructions}
                      onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Advice
            </label>
            <textarea
              value={prescriptionData.advice}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, advice: e.target.value })}
              placeholder="Enter medical advice..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              rows={2}
            />
          </div>

          {/* Follow-up Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={prescriptionData.followUp}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, followUp: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrescription}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Prescription"
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>This is an electronically generated prescription</p>
          <p>Valid only with doctor's signature and stamp</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;