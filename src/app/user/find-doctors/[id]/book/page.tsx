"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { Doctor } from "@/src/types";
import { sendBooking } from "@/src/lib/bookingbus";


type Booking = {
  id: string;
  doctorId: string;
  userId: string;
  patientName: string;
  patientAge: number;
  symptoms: string;
  date: string;
  time: string;
  createdAt: string;
};

function formatYMD(date: Date) {
  // Adjust for local timezone offset so the date is local yyyy-mm-dd
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function monthName(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthMatrix(viewDate: Date) {
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const startOffset = start.getDay();
  const days = end.getDate();
  const grid: Date[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startOffset - i));
    grid.push(d);
  }

  for (let i = 1; i <= days; i++) {
    grid.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
  }

  while (grid.length % 7 !== 0 || grid.length < 42) {
    const d = new Date(end);
    d.setDate(d.getDate() + (grid.length - (startOffset + days) + 1));
    grid.push(d);
  }

  return grid;
}

function generateSlots(interval = 30) {
  const slots: string[] = [];
  for (let h = 9; h <= 12; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (h === 12 && m > 30) break;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  for (let h = 13; h <= 17; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (h === 17 && m > 30) break;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

export default function BookDoctorPage() {
  const router = useRouter();
  const { id } = useParams(); // doctor id from route
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatYMD(new Date())
  );
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [posting, setPosting] = useState<boolean>(false);

  const [patientName, setPatientName] = useState(user?.name || "");
  const [patientAge, setPatientAge] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");

  const allSlots = useMemo(() => generateSlots(30), []);
  const morningSlots = useMemo(
    () => allSlots.filter((t) => Number(t.split(":")[0]) < 13),
    [allSlots]
  );
  const eveningSlots = useMemo(
    () => allSlots.filter((t) => Number(t.split(":")[0]) >= 13),
    [allSlots]
  );
  const bookedTimes = useMemo(() => new Set(bookings.map((b) => b.time)), [
    bookings,
  ]);

  // ✅ Fetch all doctors once and filter client-side
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/doctors", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch doctors (${res.status})`);
        const data: Doctor[] = await res.json();
        const selectedDoctor =
          data.find((d) => String(d.id) === String(id)) ?? null;
        setDoctor(selectedDoctor);
      } catch (error) {
        console.error("Error fetching doctor:", error);
        setDoctor(null);
      }
    };
    fetchDoctors();
  }, [id]);

  // ✅ Fetch bookings for selected date and doctor
  useEffect(() => {
    const fetchBookings = async () => {
      if (!id || !selectedDate) return;
      try {
        const res = await fetch(
          `/api/appointments?doctorId=${id}&date=${selectedDate}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setBookings(data.appointments || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }
    };
    fetchBookings();
  }, [id, selectedDate]);

  const isBooked = (t: string) => bookedTimes.has(t);

  // ✅ Booking submission logic
  async function book() {
    if (!selectedTime) {
      setMessage("Please select a time slot");
      setMessageType("error");
      return;
    }
    if (!patientName.trim() || !patientAge.trim() || !symptoms.trim()) {
      setMessage("Please fill all patient details");
      setMessageType("error");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: id,
          userId: user?.id ?? "guest",
          date: selectedDate,
          time: selectedTime,
          patientName: patientName.trim(),
          patientAge: Number(patientAge),
          symptoms: symptoms.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(err?.error || "Booking failed");
        setMessageType("error");
        return;
      }

      setMessage("Appointment booked successfully! 🎉");
      setMessageType("success");
      setTimeout(() => {
      router.push("/user/my-appointments");
    }, 1500);

     sendBooking({
  id: crypto.randomUUID(),
  doctorId: String(id),  // ✅ include doctor id here
  patientName,
  time: selectedTime,
  date: selectedDate,
  status: "booked",
});



      // Refresh bookings
      const updated = await fetch(
        `/api/appointments?doctorId=${id}&date=${selectedDate}`,
        { cache: "no-store" }
      );
      if (updated.ok) {
        const data = await updated.json();
        setBookings(data.appointments || []);
      }
    } catch (error) {
      console.error(error);
      setMessage("Network error while booking");
      setMessageType("error");
    } finally {
      setPosting(false);
    }
  }

  const monthGrid = useMemo(() => getMonthMatrix(calendarMonth), [calendarMonth]);
  const today = new Date();

  const onSelectDay = (d: Date): void => {
    setSelectedDate(formatYMD(d));
    setSelectedTime(null);
    setCalendarMonth(startOfMonth(d));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Navbar />
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-5 pt-6 pb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 hover:bg-white/30 transition-all hover:scale-110 shadow-lg"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="font-bold text-xl text-white">Book Appointment</h1>
        </div>

        {/* Doctor Card */}
        {doctor && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl blur-sm opacity-50"></div>
                {doctor.profileImage ? (
                  <img
                    src={doctor.profileImage}
                    alt={doctor.name}
                    className="relative w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow-xl">
                    {doctor.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{doctor.name}</h2>
                <p className="text-sm text-cyan-600 font-semibold">{doctor.specialization}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-3 h-3 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{doctor.rating}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative max-w-4xl mx-auto px-5 py-6 space-y-6">
        {/* Calendar Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-2 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Select Date</h3>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
              className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl px-4 py-2 font-bold text-gray-700 transition-all hover:scale-105 shadow-md"
            >
              ‹
            </button>
            <div className="font-bold text-gray-900 text-lg">{monthName(calendarMonth)}</div>
            <button
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl px-4 py-2 font-bold text-gray-700 transition-all hover:scale-105 shadow-md"
            >
              ›
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((d, i) => {
              const inMonth = d.getMonth() === calendarMonth.getMonth();
              const isToday = sameDay(d, today);
              const isSelected = selectedDate === formatYMD(d);
              const disabledPast =
                d <
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate()
                );

              let className = "p-3 rounded-xl font-bold text-sm transition-all duration-200 ";

              if (disabledPast || !inMonth) {
                className += "bg-gray-100 text-gray-300 cursor-not-allowed";
              } else if (isSelected) {
                className += "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg scale-105";
              } else if (isToday) {
                className +=
                  "bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 border-2 border-green-400 hover:scale-105 cursor-pointer";
              } else {
                className +=
                  "bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 text-gray-700 hover:scale-105 cursor-pointer border border-gray-200";
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (disabledPast || !inMonth) return;
                    onSelectDay(d);
                  }}
                  disabled={disabledPast || !inMonth}
                  className={className}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Select Time Slot</h3>
          </div>

          {/* Morning Slots */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-gray-800">Morning</h4>
              <span className="text-xs text-gray-500">(09:00 AM - 12:30 PM)</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {morningSlots.map((t) => {
                const booked = isBooked(t);
                const selected = selectedTime === t;

                let className = "relative p-3 rounded-xl font-semibold text-sm transition-all duration-200 ";

                if (booked) {
                  className += "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200";
                } else if (selected) {
                  className += "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg scale-105 border-2 border-cyan-300";
                } else {
                  className += "bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 text-gray-700 hover:scale-105 cursor-pointer border border-gray-200 hover:border-cyan-300";
                }

                return (
                  <button
                    key={t}
                    onClick={() => !booked && setSelectedTime(t)}
                    disabled={booked}
                    className={className}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{t}</span>
                      {booked && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                          Booked
                        </span>
                      )}
                      {selected && <Check className="w-4 h-4 absolute top-1 right-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Evening Slots */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <h4 className="font-bold text-gray-800">Evening</h4>
              <span className="text-xs text-gray-500">(01:00 PM - 05:30 PM)</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {eveningSlots.map((t) => {
                const booked = isBooked(t);
                const selected = selectedTime === t;

                let className = "relative p-3 rounded-xl font-semibold text-sm transition-all duration-200 ";

                if (booked) {
                  className += "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200";
                } else if (selected) {
                  className += "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105 border-2 border-purple-300";
                } else {
                  className += "bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 text-gray-700 hover:scale-105 cursor-pointer border border-gray-200 hover:border-purple-300";
                }

                return (
                  <button
                    key={t}
                    onClick={() => !booked && setSelectedTime(t)}
                    disabled={booked}
                    className={className}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{t}</span>
                      {booked && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                          Booked
                        </span>
                      )}
                      {selected && <Check className="w-4 h-4 absolute top-1 right-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Patient Details Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Patient Details</h3>
          <input
            type="text"
            placeholder="Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={!!user?.name}
          />
          <input
            type="number"
            placeholder="Age"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            min={0}
            max={120}
          />
          <textarea
            placeholder="Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            rows={3}
          />
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-2xl p-4 shadow-lg border ${
              messageType === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {messageType === "success" ? (
                <div className="bg-green-500 rounded-full p-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="bg-red-500 rounded-full p-2">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              )}
              <p
                className={`font-semibold ${
                  messageType === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {selectedTime && (
          <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <h3 className="font-bold text-lg">Booking Summary</h3>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Doctor:</span>
                <span className="font-bold">{doctor?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Date:</span>
                <span className="font-bold">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Time:</span>
                <span className="font-bold">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Patient:</span>
                <span className="font-bold">{patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Age:</span>
                <span className="font-bold">{patientAge}</span>
              </div>
              <div>
                <span className="text-white/80">Symptoms:</span>
                <p className="font-semibold">{symptoms}</p>
              </div>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={book}
          disabled={!selectedTime || posting}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
            !selectedTime || posting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:shadow-cyan-500/50 hover:scale-105"
          }`}
        >
          {posting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Booking...
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              Confirm Appointment
            </>
          )}
        </button>
      </div>

      <Footer />
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
