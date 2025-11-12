"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Clock, Star, MessageSquare, ArrowLeft, Award, Calendar, MapPin, Shield } from "lucide-react";
import { Doctor } from "@/src/types";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";

export default function DoctorDetails() {
  const router = useRouter();
  const { id } = useParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const found = data.find((d: Doctor) => d.id === id);
        setDoctor(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching doctors:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
        <Navbar/>
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-cyan-500 rounded-full opacity-75"></div>
          <p className="text-gray-600">Loading doctor profile...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg font-medium">Error: {error}</p>
        </div>
      </div>
    );

  if (!doctor)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg">Doctor not found</p>
        </div>
      </div>
    );

  const experience = Math.floor(Math.random() * 10) + 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <Navbar/>
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/user/find-doctors")}
            className="bg-white/80 backdrop-blur-sm rounded-full p-2.5 hover:bg-white transition shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
          >
            <ArrowLeft size={20} className="text-cyan-600" />
          </button>
          <h1 className="font-bold text-xl text-gray-800">Doctor Profile</h1>
        </div>

        <div className="relative px-5 pb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
            <div className="flex gap-5 items-start mb-5">
              {/* Profile Image with Gradient Border */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
                <img
                  src={doctor.profileImage}
                  alt={doctor.name}
                  className="relative w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-white shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {doctor.name}
                </h2>
                <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-3 py-1 rounded-full">
                    MBBS, MS
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold text-gray-700">4.8</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12} />
                  Fellow of Sanskara Natralaya, Chennai
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: <Users className="w-4 h-4" />, label: "Patients", value: "5,000+", color: "from-cyan-400 to-cyan-500" },
                { icon: <Clock className="w-4 h-4" />, label: "Experience", value: `${experience}+ yrs`, color: "from-blue-400 to-blue-500" },
                { icon: <Award className="w-4 h-4" />, label: "Rating", value: "4.8", color: "from-amber-400 to-amber-500" },
                { icon: <MessageSquare className="w-4 h-4" />, label: "Reviews", value: "4,942", color: "from-purple-400 to-purple-500" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`}></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className={`bg-gradient-to-br ${item.color} text-white p-2 rounded-lg mb-2 shadow-md`}>
                      {item.icon}
                    </div>
                    <p className="text-sm font-bold text-gray-800">{item.value}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-1.5 flex gap-2 shadow-lg border border-white/50">
          {[
            { id: "about", label: "About", icon: <Users size={16} /> },
            { id: "services", label: "Services", icon: <Shield size={16} /> },
            { id: "schedule", label: "Schedule", icon: <Calendar size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-102"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-32">
        {activeTab === "about" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-2 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">About Doctor</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {doctor.description ||
                  "Dr. Das has over 7+ years of experience in providing holistic patient care. Specialized in psychological and emotional well-being with a focus on sustainable mental health. Committed to evidence-based practices and personalized treatment plans."}
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Qualifications</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">MBBS - Medical College, Mumbai</p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">MS (Surgery) - AIIMS, Delhi</p>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">Fellow - Sanskara Natralaya, Chennai</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Specializations</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Cardiology", "Heart Surgery", "ECG Analysis", "Preventive Care"].map((spec, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center hover:scale-102 transition-transform duration-200 cursor-pointer border border-purple-100"
                  >
                    <p className="text-sm font-semibold text-purple-700">{spec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Services Offered</h3>
              </div>
              <div className="space-y-2">
                {["In-person Consultation", "Video Consultation", "Emergency Care", "Follow-up Care"].map((service, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow duration-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-700 font-medium">{service}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Weekly Schedule</h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Monday - Friday", time: "06:30 AM – 07:00 PM", status: "Available" },
                  { day: "Saturday", time: "08:00 AM – 02:00 PM", status: "Available" },
                  { day: "Sunday", time: "Closed", status: "Off" },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">{slot.day}</p>
                      <p className="text-xs text-gray-500">{slot.time}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        slot.status === "Available"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {slot.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Clinic Location</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                HealthCare Center, 123 Medical Street, Chennai - 600001
              </p>
              <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-200 hover:scale-102">
                Get Directions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="px-5 pb-6  bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm">
        <button
          onClick={() => router.push(`/user/find-doctors/${doctor.id}/book`)}
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white py-4 rounded-2xl font-bold text-base shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          Book Appointment Now
          <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </button>
      </div>
      <Footer/>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}