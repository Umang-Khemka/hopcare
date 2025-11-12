"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MedicalReport {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  date: string;
  diagnosis: string;
  medicines: any[];
  advice: string;
  followUp?: string;
  createdAt: string;
}

interface ReportsContextType {
  reports: MedicalReport[];
  addReport: (report: MedicalReport) => void;
  getReportsByDoctor: (doctorId: string) => MedicalReport[];
  getReportsByPatient: (patientName: string) => MedicalReport[];
  getReportByAppointment: (appointmentId: string) => MedicalReport | undefined;
  clearAllReports: () => void; // ✅ NEW: Clear functionality
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<MedicalReport[]>([]);

  // ✅ CHANGED: Load reports from sessionStorage (clears on browser close)
  useEffect(() => {
    const savedReports = sessionStorage.getItem('medicalReports');
    console.log("🔄 Loading reports from sessionStorage:", savedReports ? JSON.parse(savedReports).length + " reports" : "No reports");
    
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, []);

  // ✅ CHANGED: Save to sessionStorage whenever reports change
  useEffect(() => {
    sessionStorage.setItem('medicalReports', JSON.stringify(reports));
    console.log("💾 Saved to sessionStorage:", reports.length + " reports");
  }, [reports]);

  const addReport = (report: MedicalReport) => {
    setReports(prev => {
      // Avoid duplicates based on appointmentId
      const existingIndex = prev.findIndex(r => r.appointmentId === report.appointmentId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = report;
        console.log("📝 Updated existing report:", report.appointmentId);
        return updated;
      }
      
      console.log("📝 Added new report:", report.appointmentId);
      return [...prev, report];
    });
  };

  // ✅ NEW: Clear all reports function
  const clearAllReports = () => {
    setReports([]);
    sessionStorage.removeItem('medicalReports');
    console.log("🧹 All reports cleared");
  };

  const getReportsByDoctor = (doctorId: string) => {
    return reports.filter(report => report.doctorId === doctorId);
  };

  const getReportsByPatient = (patientName: string) => {
    return reports.filter(report => report.patientName === patientName);
  };

  const getReportByAppointment = (appointmentId: string) => {
    return reports.find(report => report.appointmentId === appointmentId);
  };

  return (
    <ReportsContext.Provider value={{
      reports,
      addReport,
      getReportsByDoctor,
      getReportsByPatient,
      getReportByAppointment,
      clearAllReports // ✅ NEW
    }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};