"use client";


import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Calendar, FileText, User, Bell, Search, Heart, Star, Clock, MapPin, Sparkles } from "lucide-react";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { Doctor } from "@/src/types";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      setDoctors(data);
    };
    fetchDoctors();
  }, []);

  const toggleFavorite = (id: string) => {
  setFavorites((prev) =>
    prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
  );
};

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex flex-col relative overflow-hidden">
      <Navbar/>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[40%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-5 pt-8 pb-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="https://randomuser.me/api/portraits/women/65.jpg"
                alt="User"
                className="w-12 h-12 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="text-white font-bold text-lg flex items-center gap-2">
                👋 Hi, {user?.name || "Priya"}
              </p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <MapPin size={12} />
                {user?.location || "Dombivli, Mumbai"}
              </p>
            </div>
          </div>
          <button className="relative bg-white/20 backdrop-blur-sm rounded-full p-2.5 hover:bg-white/30 transition-all hover:scale-110 shadow-lg">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/20 rounded-2xl blur-sm"></div>
          <div className="relative flex items-center bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/50">
            <Search className="w-5 h-5 text-cyan-600 mr-3" />
            <input
              type="text"
              placeholder="Search doctors, specialties..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All Doctors", icon: <Sparkles size={14} /> },
            { id: "cardiologist", label: "Cardiology", icon: <Heart size={14} /> },
            { id: "general", label: "General", icon: <Star size={14} /> },
            { id: "available", label: "Available Now", icon: <Clock size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-cyan-600 shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Banner */}
      <div className="relative px-5 -mt-4 mb-4 z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 border border-white/50">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="text-center px-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                {doctors.length}+
              </p>
              <p className="text-xs text-gray-600 font-medium">Doctors</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                24/7
              </p>
              <p className="text-xs text-gray-600 font-medium">Support</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                4.9★
              </p>
              <p className="text-xs text-gray-600 font-medium">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4">
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 font-medium">No doctors found</p>
            <p className="text-sm text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          filteredDoctors.map((doc, index) => {
            const isFavorite = favorites.includes(doc.id);
            return (
              <motion.div
                key={doc.id}
                onClick={() => router.push(`/user/find-doctors/${doc.id}`)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-4 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>

                <div className="relative flex items-start gap-4">
                  {/* Doctor Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={doc.profileImage}
                      alt={doc.name}
                      className="relative w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1.5 border-3 border-white shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex-1 min-w-0 pr-10">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-cyan-600 transition-colors truncate">
                      {doc.name}
                    </h3>
                    <p className="text-sm font-semibold text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text">
                      {doc.specialization}
                    </p>
                    <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        {doc.availability}
                      </div>
                      <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
                        <Clock size={12} />
                        {doc.workingHours}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${
                              i < 4
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-300 text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{doc.rating}</span>
                      <span className="text-xs text-gray-400">(1.2k reviews)</span>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(doc.id);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg hover:shadow-xl active:scale-90 transition-all border border-gray-100"
                  >
                    {isFavorite ? (
                      <motion.div
                        key="filled"
                        initial={{ scale: 0.5, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Heart size={20} className="fill-red-500 text-red-500" />
                      </motion.div>
                    ) : (
                      <Heart
                        size={20}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      />
                    )}
                  </button>
                </div>

                {/* Bottom Arrow Indicator */}
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                  <div className="flex items-center gap-1 text-cyan-600 text-xs font-semibold">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      <Footer/>
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}