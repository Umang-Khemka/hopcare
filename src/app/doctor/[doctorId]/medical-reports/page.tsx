"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FileText, ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MedicalReport, Doctor, Prescription, Appointment } from '@/src/types';

function stripDrPrefix(name?: string) {
  if (!name) return "";
  return name.replace(/^\s*dr\.?\s*/i, "").trim();
}

function shortName(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ");
}

export default function MedicalReportsPage() {
  const router = useRouter();
  const { doctorId } = useParams();
  const searchParams = useSearchParams();
  const patientName = searchParams.get('patientName');
  
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchMedicalReports = async () => {
      try {
        if (!patientName) {
          setLoading(false);
          return;
        }

        // Fetch appointments for this patient
        const appointmentsRes = await fetch(`/api/appointments?patientName=${encodeURIComponent(patientName)}`);
        const appointmentsData = await appointmentsRes.json();

        if (appointmentsData.appointments?.length > 0) {
          const reportsData: MedicalReport[] = [];

          // Fetch prescriptions and doctor info for each appointment
          for (const appointment of appointmentsData.appointments) {
            try {
              // Fetch prescription
              const prescriptionRes = await fetch(`/api/prescriptions?appointmentId=${appointment.id}`);
              const prescriptionData = await prescriptionRes.json();

              if (prescriptionData.prescriptions?.length > 0) {
                const prescription: Prescription = prescriptionData.prescriptions[0];

                // Fetch doctor info
                const doctorsRes = await fetch("/api/doctors");
                const doctorsData = await doctorsRes.json();
                const doctor: Doctor = doctorsData.find((d: Doctor) => d.id === appointment.doctorId);

                if (doctor) {
                  const report: MedicalReport = {
                    id: prescription.id || appointment.id,
                    appointmentId: appointment.id,
                    patientName: appointment.patientName,
                    patientAge: appointment.patientAge?.toString(),
                    date: appointment.date,
                    time: appointment.time,
                    symptoms: appointment.symptoms,
                    diagnosis: prescription.diagnosis,
                    medicines: prescription.medicines.map(med => ({
                      name: med.name,
                      type: med.type,
                      dosage: med.dosage,
                      frequency: med.frequency,
                      duration: med.duration,
                      instructions: med.instructions,
                      days: med.days,
                      timesPerDay: med.timesPerDay
                    })),
                    advice: prescription.advice,
                    followUp: prescription.followUp,
                    createdAt: prescription.createdAt,
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    doctorSpecialization: doctor.specialization,
                    doctorExperience: doctor.experience,
                    doctorLocation: doctor.location,
                    doctorRegNo: "NEDSCC3",
                    doctorPhone: doctor.phone,
                    doctorEmail: doctor.email
                  };
                  reportsData.push(report);
                }
              }
            } catch (error) {
              console.error(`Error fetching data for appointment ${appointment.id}:`, error);
            }
          }

          // Sort reports by date (newest first)
          const sortedReports = reportsData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setReports(sortedReports);
        }
      } catch (error) {
        console.error("Error fetching medical reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalReports();
  }, [patientName]);

  const downloadAllReportsAsPDF = async () => {
    if (reports.length === 0) return;
    
    setDownloading(true);
    try {
      // Create a new window for printing all reports
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download all reports');
        return;
      }

      // Generate HTML content for all reports
      const reportsHTML = reports.map((report, index) => `
        <div class="report-page" style="page-break-after: ${index === reports.length - 1 ? 'auto' : 'always'};">
          <div class="report-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; position: relative;">
            
            <!-- Watermark -->
            <div style="position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: -1;">
              <div style="transform: rotate(-30deg); opacity: 0.04; font-size: 72px; font-weight: 700; letter-spacing: 6px; color: #000; white-space: nowrap;">
                ${stripDrPrefix(report.doctorName)}
              </div>
            </div>

            <!-- Header -->
            <div style="background: linear-gradient(to right, #0d9488, #0f766e); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 2px; margin: 0;">HOPECARE CLINIC</h1>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                <div>
                  <h2 style="font-size: 20px; font-weight: 700; margin: 0;">Dr. ${stripDrPrefix(report.doctorName)}</h2>
                  <p style="text-transform: uppercase; letter-spacing: 1px; font-size: 14px; margin: 4px 0 0 0;">${report.doctorSpecialization || "PSYCHOLOGIST"}</p>
                  ${report.doctorExperience ? `<p style="font-size: 12px; opacity: 0.9; margin: 4px 0 0 0;">Experience: ${report.doctorExperience} years</p>` : ''}
                </div>
                <div style="font-size: 48px;">🩺</div>
              </div>
            </div>

            <!-- Patient details -->
            <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
              <div style="display: flex; justify-content: space-between;">
                <p><strong>Patient Name:</strong> ${report.patientName}</p>
                <p><strong>Date:</strong> ${new Date(report.date).toLocaleDateString("en-IN")}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <p><strong>Age:</strong> ${report.patientAge || "N/A"}</p>
                <p><strong>Time:</strong> ${report.time || "N/A"}</p>
              </div>
              <div style="margin-top: 8px;">
                <p><strong>Prescription ID:</strong> ${report.id}</p>
              </div>
              <p style="margin-top: 8px;"><strong>Symptoms:</strong> ${report.symptoms || "N/A"}</p>
              <p style="margin-top: 4px;"><strong>Diagnosis:</strong> ${report.diagnosis || ""}</p>
            </div>

            <!-- Rx Section -->
            <div style="padding: 32px 24px 24px 24px; min-height: 460px; color: #111827;">
              <h1 style="font-size: 36px; font-weight: 700; color: #0f766e; margin-bottom: 24px;">Rx</h1>

              ${report.medicines?.map(med => `
                <div style="margin-bottom: 12px;">
                  <p style="font-weight: 600; font-size: 18px;">
                    ${med.name} <span style="font-size: 14px; color: #6b7280;">(${med.type || "Tablet"})</span>
                  </p>
                  <p style="margin-left: 16px;">Dosage: ${med.dosage}</p>
                  <p style="margin-left: 16px;">Frequency: ${med.frequency}</p>
                  <p style="margin-left: 16px;">Duration: ${med.duration}</p>
                  ${med.instructions ? `<p style="margin-left: 16px; font-style: italic; color: #6b7280;">Note: ${med.instructions}</p>` : ''}
                </div>
              `).join('')}

              ${report.advice ? `
                <div style="margin-top: 24px;">
                  <p style="font-weight: 600;">Advice:</p>
                  <p style="margin-left: 16px;">${report.advice}</p>
                </div>
              ` : ''}

              ${report.followUp ? `
                <div style="margin-top: 16px;">
                  <p style="font-weight: 600;">Follow-Up:</p>
                  <p style="margin-left: 16px; color: #111827; font-weight: 500;">
                    ${new Date(report.followUp).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              ` : ''}
            </div>

            <!-- Signature & Stamp -->
            <div style="position: relative; padding: 0 24px 64px 24px;">
              <div style="position: absolute; right: 24px; bottom: 120px;">
                <div style="transform: translateY(-28px);">
                  <span style="font-family: 'Segoe Script', 'Lucida Handwriting', cursive; font-size: 36px; opacity: 0.95;">
                    ${stripDrPrefix(report.doctorName)}
                  </span>
                </div>
                <div style="margin-top: 4px; width: 176px; text-align: center;">
                  <div style="border-top: 1px solid #000;"></div>
                  <p style="font-size: 14px; margin-top: 4px; font-weight: 500;">Signature</p>
                </div>
              </div>

              <div style="position: absolute; right: 24px; bottom: 14px;">
                <svg width="130" height="130" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="#B31312" stroke-width="7" fill="none" opacity="0.93" />
                  <circle cx="100" cy="100" r="55" stroke="#B31312" stroke-width="3.5" fill="none" opacity="0.9" />
                  <defs><path id="topArcStamp${report.id}" d="M40,100 A60,60 0 0,1 160,100" /></defs>
                  <text fill="#B31312" font-size="13" font-weight="800">
                    <textPath href="#topArcStamp${report.id}" startOffset="50%" text-anchor="middle">HOPECARE CLINIC</textPath>
                  </text>
                  <text x="100" y="100" text-anchor="middle" font-size="16" font-weight="900" fill="#B31312">${shortName(stripDrPrefix(report.doctorName))}</text>
                  <text x="100" y="120" text-anchor="middle" font-size="11.5" font-weight="800" fill="#B31312">Reg No: ${report.doctorRegNo || "NEDSCC3"}</text>
                </svg>
              </div>

              <div style="width: 100%; margin-top: 24px; border-top: 1px dashed #d1d5db;"></div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; border-top: 1px solid #e5e7eb; padding: 16px; text-align: center; font-size: 14px; color: #374151; border-radius: 0 0 8px 8px;">
              <p style="font-weight: 600;">${report.doctorLocation || "123 Lorem Ipsum St."}</p>
              <p>Reg No: ${report.doctorRegNo || "NEDSCC3"} | Phone: ${report.doctorPhone || "+00 123 456 789"}</p>
              <p>Email: ${report.doctorEmail || "doctor@email.com"}</p>
            </div>
          </div>
        </div>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Medical Reports - ${patientName}</title>
            <style>
              @media print {
                @page { 
                  size: A4; 
                  margin: 0.35in; 
                }
                body { 
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                  margin: 0; 
                  padding: 0;
                }
                .report-page {
                  page-break-after: always;
                  margin-bottom: 20px;
                }
                .report-page:last-child {
                  page-break-after: auto;
                }
                .report-container {
                  box-shadow: none !important;
                  border: none !important;
                }
              }
              @media screen {
                body { 
                  background: #f3f4f6; 
                  padding: 20px;
                }
                .report-container {
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  border: 1px solid #e5e7eb;
                  background: white;
                }
              }
            </style>
          </head>
          <body>
            ${reportsHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error downloading reports. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 text-lg">
        Loading medical reports...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
              <p className="text-gray-600 mt-2">
                {patientName ? `Reports for ${patientName}` : 'All patient reports'}
              </p>
            </div>
          </div>

          {/* Download All Reports Button */}
          {reports.length > 0 && (
            <button
              onClick={downloadAllReportsAsPDF}
              disabled={downloading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg shadow-lg text-lg transition-all"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Downloading...' : `Download All Reports (${reports.length})`}
            </button>
          )}
        </div>

        {/* Rest of the component remains the same */}
        {/* Reports List */}
        <div className="space-y-8">
          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Reports Found
              </h3>
              <p className="text-gray-500">
                {patientName 
                  ? `No medical reports found for ${patientName}`
                  : 'No medical reports available'
                }
              </p>
            </div>
          ) : (
            reports.map((report, index) => (
              <div 
                key={report.id} 
                className="max-w-3xl mx-auto border shadow-lg bg-white rounded-lg relative"
                style={{
                  height: "1123px",
                  overflow: "hidden",
                  pageBreakInside: "avoid"
                }}
              >
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
                    {stripDrPrefix(report.doctorName)}
                  </div>
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-400 to-teal-600 text-white p-6 rounded-t-lg">
                  <h1 className="text-center text-2xl font-extrabold tracking-wide">HOPECARE CLINIC</h1>
                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <h2 className="text-xl font-bold">Dr. {stripDrPrefix(report.doctorName)}</h2>
                      <p className="uppercase tracking-wide text-sm">{report.doctorSpecialization || "PSYCHOLOGIST"}</p>
                      {report.doctorExperience && (
                        <p className="text-xs opacity-90">Experience: {report.doctorExperience} years</p>
                      )}
                    </div>
                    <div className="text-5xl">🩺</div>
                  </div>
                </div>

                {/* Patient details */}
                <div className="p-6 border-b text-sm text-gray-700">
                  <div className="flex justify-between">
                    <p><span className="font-semibold">Patient Name:</span> {report.patientName}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(report.date).toLocaleDateString("en-IN")}</p>
                  </div>

                  <div className="flex justify-between mt-2">
                    <p><span className="font-semibold">Age:</span> {report.patientAge || "N/A"}</p>
                    <p><span className="font-semibold">Time:</span> {report.time || "N/A"}</p>
                  </div>

                  <div className="mt-2">
                    <p><span className="font-semibold">Prescription ID:</span> {report.id}</p>
                  </div>

                  <p className="mt-2"><span className="font-semibold">Symptoms:</span> {report.symptoms || "N/A"}</p>
                  <p className="mt-1"><span className="font-semibold">Diagnosis:</span> {report.diagnosis || ""}</p>
                </div>

                {/* Rx Section */}
                <div className="p-8 pt-6 text-gray-900" style={{ minHeight: "460px" }}>
                  <h1 className="text-4xl font-bold text-teal-700 mb-6">Rx</h1>

                  {report.medicines?.map((med, i) => (
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

                  {report.advice && (
                    <div className="mt-6">
                      <p className="font-semibold">Advice:</p>
                      <p className="ml-4">{report.advice}</p>
                    </div>
                  )}

                  {/* Follow-Up */}
                  {report.followUp && (
                    <div className="mt-4">
                      <p className="font-semibold">Follow-Up:</p>
                      <p className="ml-4 text-gray-800 font-medium">
                        {new Date(report.followUp).toLocaleDateString("en-IN", {
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
                        {stripDrPrefix(report.doctorName)}
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
                      <text x="100" y="100" textAnchor="middle" fontSize="16" fontWeight="900" fill="#B31312">{shortName(stripDrPrefix(report.doctorName))}</text>
                      <text x="100" y="120" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#B31312">Reg No: {report.doctorRegNo || "NEDSCC3"}</text>
                    </svg>
                  </div>

                  <div className="w-full mt-6 border-t border-dashed border-gray-200" />
                </div>

                {/* Footer */}
                <div className="bg-gray-100 border-t p-4 text-center text-sm text-gray-700 rounded-b-lg">
                  <p className="font-semibold">{report.doctorLocation || "123 Lorem Ipsum St."}</p>
                  <p>Reg No: {report.doctorRegNo || "NEDSCC3"} | Phone: {report.doctorPhone || "+00 123 456 789"}</p>
                  <p>Email: {report.doctorEmail || "doctor@email.com"}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {reports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(reports.map(r => r.doctorName)).size}
              </div>
              <div className="text-sm text-gray-600">Different Doctors</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {reports.reduce((total, report) => total + (report.medicines?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Medicines</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}