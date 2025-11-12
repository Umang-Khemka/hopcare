"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Search, 
  History, 
  User, 
  Calendar, 
  Clock, 
  ArrowLeft,
  FileText
} from "lucide-react";
import { Appointment } from "@/src/types";

const PatientHistoryPage = () => {
  const { doctorId } = useParams();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [completedPatients, setCompletedPatients] = useState<Appointment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch completed patients
  useEffect(() => {
    const fetchCompletedPatients = async () => {
      if (!doctorId) return;
      try {
        const res = await fetch(`/api/appointments?doctorId=${doctorId}&status=completed`);
        const data = await res.json();
        if (data.appointments) {
          setCompletedPatients(data.appointments);
          setFilteredPatients(data.appointments);
        }
      } catch (err) {
        console.error("Error fetching completed patients:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedPatients();
  }, [doctorId]);

  // Filter patients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(completedPatients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = completedPatients.filter(patient => 
      patient.patientName.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      (patient.prescriptionId && patient.prescriptionId.toLowerCase().includes(query))
    );
    
    setFilteredPatients(filtered);
  }, [searchQuery, completedPatients]);

  const goBack = () => {
    router.push(`/doctor/${doctorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading patient history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
                <p className="text-sm text-gray-600">View completed appointments and medical records</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by patient name, appointment ID, or prescription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-700"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Completed Appointments ({filteredPatients.length})
            </h2>
            <div className="text-sm text-gray-600">
              Sorted by most recent first
            </div>
          </div>
          
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-cyan-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-10 h-10 text-cyan-600" />
              </div>
              <p className="text-gray-900 font-bold text-xl mb-2">
                No completed appointments found
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Try a different search term" : "Completed appointments will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    // Yahan aap patient ki full history page par redirect kar sakte hain
                    console.log("View full history for:", patient.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{patient.patientName}</p>
                        <p className="text-sm text-gray-600">
                          Age: {patient.patientAge} • Date: {new Date(patient.date).toLocaleDateString("en-IN")}
                        </p>
                        {patient.prescriptionId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Prescription ID: {patient.prescriptionId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        Completed
                      </span>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-4 h-4" />
                        {patient.time}
                      </p>
                    </div>
                  </div>
                  
                  {patient.symptoms && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-bold">Symptoms:</span> {patient.symptoms}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Appointment ID: {patient.id}</span>
                    <span className="mx-2">•</span>
                    <span>Created: {new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPage;