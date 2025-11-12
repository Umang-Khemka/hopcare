"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pill, ArrowLeft, Plus, X } from "lucide-react";

export default function PrescriptionPage() {
  const { doctorId, appointmentId } = useParams();
  const router = useRouter();

  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: "",
    medicines: [] as { name: string; days: string; timesPerDay: string }[],
    advice: "",
    followUp: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddMedicine = () => {
    setPrescriptionData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: "", days: "", timesPerDay: "" }],
    }));
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptionData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!prescriptionData.diagnosis || prescriptionData.medicines.length === 0) {
      alert("Please fill Diagnosis & add at least one Medicine");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          diagnosis: prescriptionData.diagnosis,
          medicines: prescriptionData.medicines,
          advice: prescriptionData.advice,
          followUp: prescriptionData.followUp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Prescription Saved Successfully ✅");
        router.push(`/doctor/${doctorId}/completed`);
      } else {
        alert("Error saving prescription");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white rounded-xl shadow hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Pill className="w-6 h-6 text-cyan-600" /> Create Prescription
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Fill the details below to create a new prescription
            </p>
          </div>
        </div>

        {/* Prescription Form */}
        <div className="bg-white/90 rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Diagnosis */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Diagnosis
            </label>
            <textarea
              rows={2}
              placeholder="Enter diagnosis"
              value={prescriptionData.diagnosis}
              onChange={(e) =>
                setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })
              }
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
            />
          </div>

          {/* Medicines */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Medicines
            </label>

            <div className="space-y-4">
              {prescriptionData.medicines.map((med, index) => (
                <div
                  key={index}
                  className="p-4 border border-cyan-200 bg-cyan-50 rounded-2xl relative"
                >
                  <button
                    onClick={() => handleRemoveMedicine(index)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) => {
                      const newMeds = [...prescriptionData.medicines];
                      newMeds[index].name = e.target.value;
                      setPrescriptionData({ ...prescriptionData, medicines: newMeds });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:border-cyan-500 outline-none"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Days"
                      value={med.days}
                      onChange={(e) => {
                        const newMeds = [...prescriptionData.medicines];
                        newMeds[index].days = e.target.value;
                        setPrescriptionData({ ...prescriptionData, medicines: newMeds });
                      }}
                      className="w-1/2 border border-gray-300 rounded-lg p-2 focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Times/Day"
                      value={med.timesPerDay}
                      onChange={(e) => {
                        const newMeds = [...prescriptionData.medicines];
                        newMeds[index].timesPerDay = e.target.value;
                        setPrescriptionData({ ...prescriptionData, medicines: newMeds });
                      }}
                      className="w-1/2 border border-gray-300 rounded-lg p-2 focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddMedicine}
                className="flex items-center gap-2 border border-cyan-500 text-cyan-600 px-4 py-2 rounded-xl hover:bg-cyan-50 font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>
          </div>

          {/* Advice */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Advice
            </label>
            <textarea
              rows={2}
              placeholder="Enter advice"
              value={prescriptionData.advice}
              onChange={(e) =>
                setPrescriptionData({ ...prescriptionData, advice: e.target.value })
              }
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
            />
          </div>

          {/* Follow-up */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Follow-up Date
            </label>
            <input
              type="date"
              value={prescriptionData.followUp}
              onChange={(e) =>
                setPrescriptionData({ ...prescriptionData, followUp: e.target.value })
              }
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
              }`}
            >
              {loading ? "Saving..." : "Save Prescription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
