"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";
import { Printer } from "lucide-react";
import { Prescription } from "@/src/types";

function stripDrPrefix(name?: string) {
  if (!name) return "";
  return name.replace(/^\s*dr\.?\s*/i, "").trim();
}
function shortName(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
}

export default function ReportPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const prescriptionRes = await fetch(`/api/prescriptions?appointmentId=${appointmentId}`);
        const prescriptionData = await prescriptionRes.json();

        if (prescriptionData.prescriptions?.length > 0) {
          const pres = prescriptionData.prescriptions[0];
          setPrescription(pres);

          const appointmentRes = await fetch(`/api/appointments?id=${appointmentId}`);
          const appointmentData = await appointmentRes.json();

          if (appointmentData.appointment) {
            setAppointment(appointmentData.appointment);

            const doctorsRes = await fetch("/api/doctors");
            const doctorsData = await doctorsRes.json();
            const foundDoctor = doctorsData.find((d: any) => d.id === appointmentData.appointment.doctorId);
            setDoctorInfo(foundDoctor || null);
          }
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [appointmentId]);

  const rawDoctorName = doctorInfo?.name || "Doctor Name";
  const plainDoctorName = stripDrPrefix(rawDoctorName);
  const doctorDisplayName = `Dr. ${plainDoctorName}`;
  const specialization = doctorInfo?.specialization || "General Practitioner";
  const doctorExperience = doctorInfo?.experience || "";
  const doctorLocation = doctorInfo?.location || "123 Lorem Ipsum St.";
  const doctorRegNo = doctorInfo?.registrationNo || "NEDSCC3";
  const doctorPhone = doctorInfo?.phone || "+00 123 456 789";
  const doctorEmail = doctorInfo?.email || "doctor@email.com";

  const patientName = appointment?.patientName || "Patient";
  const patientAge = appointment?.patientAge || "";
  const appointmentDate = appointment?.date ? new Date(appointment.date).toLocaleDateString("en-IN") : "";
  const appointmentTime = appointment?.time || "";
  const symptoms = appointment?.symptoms || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 text-lg">
        Loading prescription report...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:bg-white relative">

      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: "rotate(-30deg)",
            opacity: 0.04,
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "6px",
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          {plainDoctorName}
        </div>
      </div>

      <div className="print:hidden">
        <Navbar />
      </div>

      {/* A4 FIXED HEIGHT SINGLE PAGE */}
      <div
        className="max-w-3xl mx-auto mt-6 border shadow-lg bg-white rounded-lg print:shadow-none print:border-none relative z-10"
        style={{
          height: "1123px",
          overflow: "hidden",
          pageBreakInside: "avoid"
        }}
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white p-6 rounded-t-lg">
          <h1 className="text-center text-2xl font-extrabold tracking-wide">HOPECARE CLINIC</h1>
          <div className="flex justify-between items-center mt-3">
            <div>
              <h2 className="text-xl font-bold">{doctorDisplayName}</h2>
              <p className="uppercase tracking-wide text-sm">{specialization}</p>
              {doctorExperience && (
                <p className="text-xs opacity-90">Experience: {doctorExperience} years</p>
              )}
            </div>
            <div className="text-5xl">🩺</div>
          </div>
        </div>

        {/* Patient details */}
        <div className="p-6 border-b text-sm text-gray-700">
          <div className="flex justify-between">
            <p><span className="font-semibold">Patient Name:</span> {patientName}</p>
            <p><span className="font-semibold">Date:</span> {appointmentDate}</p>
          </div>

          <div className="flex justify-between mt-2">
            <p><span className="font-semibold">Age:</span> {patientAge}</p>
            <p><span className="font-semibold">Time:</span> {appointmentTime}</p>
          </div>

          <div className="mt-2">
            <p><span className="font-semibold">Prescription ID:</span> {prescription?.id}</p>
          </div>

          <p className="mt-2"><span className="font-semibold">Symptoms:</span> {symptoms}</p>
          <p className="mt-1"><span className="font-semibold">Diagnosis:</span> {prescription?.diagnosis || ""}</p>
        </div>

        {/* Rx */}
        <div className="p-8 pt-6 text-gray-900" style={{ minHeight: "460px" }}>
          <h1 className="text-4xl font-bold text-teal-700 mb-6">Rx</h1>

          {prescription?.medicines?.map((med, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-lg">
                {med.name} <span className="text-sm text-gray-500">({med.type || "Tablet"})</span>
              </p>
              <p className="ml-4">Dosage: {med.dosage}</p>
              <p className="ml-4">Frequency: {med.frequency}</p>
              <p className="ml-4">Duration: {med.duration}</p>
              {med.instructions && <p className="ml-4 italic text-gray-600">Note: {med.instructions}</p>}
            </div>
          ))}

          {prescription?.advice && (
            <div className="mt-6">
              <p className="font-semibold">Advice:</p>
              <p className="ml-4">{prescription.advice}</p>
            </div>
          )}

          {/* ✅ Follow-Up Added Below Advice */}
          {prescription?.followUp && (
            <div className="mt-4">
              <p className="font-semibold">Follow-Up:</p>
              <p className="ml-4 text-gray-800 font-medium">
                {new Date(prescription.followUp).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
          )}
        </div>

        {/* Signature & Stamp */}
        <div className="relative px-6 pb-16">
          <div className="absolute right-6" style={{ bottom: "120px" }}>
            <div style={{ transform: "translateY(-28px)" }}>
              <span
                style={{
                  fontFamily: "'Segoe Script', 'Lucida Handwriting', cursive",
                  fontSize: "36px",
                  opacity: 0.95
                }}
              >
                {plainDoctorName}
              </span>
            </div>
            <div className="mt-1 w-44 text-center">
              <div className="border-t" />
              <p className="text-sm mt-1 font-medium">Signature</p>
            </div>
          </div>

          <div className="absolute right-6" style={{ bottom: "14px" }}>
            <svg width="130" height="130" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" stroke="#B31312" strokeWidth="7" fill="none" opacity="0.93" />
              <circle cx="100" cy="100" r="55" stroke="#B31312" strokeWidth="3.5" fill="none" opacity="0.9" />
              <defs><path id="topArcStamp" d="M40,100 A60,60 0 0,1 160,100" /></defs>
              <text fill="#B31312" fontSize="13" fontWeight="800">
                <textPath href="#topArcStamp" startOffset="50%" textAnchor="middle">HOPECARE CLINIC</textPath>
              </text>
              <text x="100" y="100" textAnchor="middle" fontSize="16" fontWeight="900" fill="#B31312">{shortName(plainDoctorName)}</text>
              <text x="100" y="120" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#B31312">Reg No: {doctorRegNo}</text>
            </svg>
          </div>

          <div className="w-full mt-6 border-t border-dashed border-gray-200" />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t p-4 text-center text-sm text-gray-700 rounded-b-lg">
          <p className="font-semibold">{doctorLocation}</p>
          <p>Reg No: {doctorRegNo} | Phone: {doctorPhone}</p>
          <p>Email: {doctorEmail}</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center mt-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg"
        >
          <Printer className="w-5 h-5" /> Print Prescription
        </button>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0.35in; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { padding: 0; margin: 0; height: 100%; }
          svg { shape-rendering: geometricPrecision; }
        }
      `}</style>
    </div>
  );
}
