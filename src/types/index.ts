// 🧩 Common User Interface (works for both patient & doctor)
export interface User {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  location?: string;

  // ✅ Optional doctor fields (safe to access dynamically)
  specialization?: string;
  experience?: string;
  rating?: number;
  phone?: string;
  profileImage?: string;
}

// 🧾 Login and OTP Forms
export interface LoginForm {
  identifier: string;
  rememberMe: boolean;
}

export interface OTPForm {
  otp: string;
}

// 🧠 Auth Context Interface
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; 
  login: (user: User, rememberMe: boolean) => void;
  logout: () => void;
}

// ✅ Doctor Type (full details, used in /api/doctors etc.)
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  email: string;
  phone: string;
  location: string;
  profileImage: string;
  availability: string;
  workingHours: string;
  isFavorited?: boolean;
  description?: string;
   registrationNo?: string; // Add this line
}

// ✅ Appointment-related types
export interface AppointmentSlot {
  time: string;
  patient: string;
  type: string;
  status: string;
}

export interface WeeklyAppointment {
  id: number;
  day: string;
  date: string;
  count: number;
  slots: AppointmentSlot[];
}

export interface CancelledAppointment {
  id: number;
  patient: string;
  date: string;
  time: string;
  reason: string;
  cancelledBy: string;
  contact: string;
}

export interface UpcomingAppointment {
  id: number;
  patient: string;
  date: string;
  time: string;
  type: string;
  contact: string;
}

export interface RecentPatient {
  id: number;
  name: string;
  lastVisit: string;
  condition: string;
}

export interface TodayStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export interface Appointment {
  id: string;               
  doctorId: string;         
  userId: string;
  patientName: string;
  patientAge: number;
  symptoms: string;            
  date: string;            
  time: string;             
  status: "booked" | "cancelled" | "completed"; 
  createdAt: string;     
  rescheduleCount?: number;
  updatedAt: string;
  prescriptionId?: string;
}

// GET /api/appointments?doctorId=123&date=2025-10-28
export interface AppointmentQuery {
  doctorId: string;
  date: string;
}

// POST /api/appointments
export interface AppointmentRequest {
  doctorId: string;
  userId: string;
  patientName: string;
  patientAge: number;
  symptoms: string;
  date: string;
  time: string;
}

// Response from GET or POST
export interface AppointmentResponse {
  success?: boolean;
  message?: string;
  error?: string;
  appointments?: Appointment[];
  booking?: Appointment;
  appointment?: Appointment;   // for single item (reschedule/update)
}

// ✅ Prescription-related types
export interface Prescription {
  id: string;
  appointmentId: string;
  diagnosis: string;
  medicines: {
    name: string;
    type?: string;          // NEW FIELD
    dosage?: string;        // NEW FIELD  
    duration?: string;      // NEW FIELD (replaces days)
    frequency?: string;     // NEW FIELD (replaces timesPerDay)
    instructions?: string;  // NEW FIELD
    days?: string;          // OLD FIELD (for backward compatibility)
    timesPerDay?: string;   // OLD FIELD (for backward compatibility)
  }[];
  advice: string;
  followUp: string;
  createdAt: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  availableSlots: string[];
  date: string;
  doctorId: string;
  totalSlots?: number;
  bookedSlots?: number;
  availableCount?: number;
  error?: string;
}

// ✅ NEW: Notification-related types for Navbar
export interface AppointmentData {
  date: string;
  time: string;
}

export interface RescheduleNotificationData {
  appointmentId: string;
  doctorName: string;
  date: string;
  time: string;
  rescheduleCount?: number;
  updatedAt: string;
}

// ✅ NEW: Notification interface for Navbar
export interface Notification {
  type: 'reschedule';
  id: string;
  appointmentId: string;
  doctorName: string;
  date: string;
  time: string;
  rescheduleCount?: number;
  updatedAt: string;
  createdAt: string;
  isRead?: boolean;
}

// ==================== MEDICAL REPORTS TYPES ====================

// Medical Report Medicine Interface
export interface Medicine {
  name: string;
  type?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  days?: string;          // Legacy field
  timesPerDay?: string;   // Legacy field
}

// Medical Report Interface (extended from Prescription)
export interface MedicalReport {
  id: string;
  appointmentId: string;
  patientName: string;
  patientAge?: string;
  date: string;
  time?: string;
  symptoms?: string;
  diagnosis?: string;
  medicines: Medicine[];
  advice?: string;
  followUp?: string;
  createdAt: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorExperience?: string;
  doctorLocation?: string;
  doctorRegNo?: string;
  doctorPhone?: string;
  doctorEmail?: string;
}

// Reports Data Interface for Medical Reports Page
export interface ReportData {
  id: string;
  patientName: string;
  patientAge?: string;
  date: string;
  time?: string;
  symptoms?: string;
  diagnosis?: string;
  medicines?: Medicine[];
  advice?: string;
  followUp?: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorExperience?: string;
  doctorLocation?: string;
  doctorRegNo?: string;
  doctorPhone?: string;
  doctorEmail?: string;
}

// Reports Context Types
export interface ReportsContextType {
  reports: ReportData[];
  getReportsByPatient: (patientName: string) => ReportData[];
  addReport: (report: ReportData) => void;
  updateReport: (id: string, report: Partial<ReportData>) => void;
  deleteReport: (id: string) => void;
}

export interface Feedback {
  id: string;
  appointmentId: string;
  rating: number;
  message: string;
  createdAt: string;
  patientId: string;
  patientName: string; // ✅ ADDED
  doctorId: string; // ✅ ADDED
}

// API Response Types for Medical Reports
export interface MedicalReportsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  reports?: MedicalReport[];
  report?: MedicalReport;
}

// Patient Reports Query
export interface PatientReportsQuery {
  patientName: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}