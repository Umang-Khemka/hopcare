

export interface MockUser {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  location: string;
  password?: string; // For demo only, in real app this would be hashed

  role: 'patient' | 'doctor'; // Add role field
  // Doctor-specific fields (optional for patients)
  specialization?: string;
  experience?: string;
  rating?: number;
  profileImage?: string;
}

import {
  WeeklyAppointment,
  CancelledAppointment,
  UpcomingAppointment,
  RecentPatient,
  TodayStats
} from "../types/index";

export const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    mobile: "9876543210",
    location: "Mumbai, India",
    password: "demo123",
    role: "patient"
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    mobile: "9876543211",
    location: "Delhi, India",
    password: "demo123",
    role: "patient"
  },
  {
    id: "3",
    name: "Raj Kumar",
    email: "raj@example.com",
    mobile: "9876543212",
    location: "Bangalore, India",
    password: "demo123",
    role: "patient"
  },
  {
    id: "4",
    name: "Priya Sharma",
    email: "priya@example.com",
    mobile: "9876543213",
    location: "Ahmedabad, India",
    password: "demo123",
    role: "patient"
  }
];

//doctotrs data

export const mockDoctors: MockUser[] = [
  {
    id: "DOC001",
    name: "Dr. John Smith",
    email: "dr.smith@hospital.com",
    mobile: "9876543220",
    location: "Mumbai, India",
    password: "doctor123",
    role: "doctor",
    specialization: "Cardiologist",
    experience: "15 years",
    rating: 4.8,
    profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400"
  },
  {
    id: "DOC002",
    name: "Dr. Sarah Johnson",
    email: "dr.sarah@hospital.com",
    mobile: "9876543221",
    location: "Delhi, India",
    password: "doctor123",
    role: "doctor",
    specialization: "Neurologist",
    experience: "12 years",
    rating: 4.9,
    profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400"
  },
  {
    id: "DOC003",
    name: "Dr. Mike Wilson",
    email: "dr.mike@hospital.com",
    mobile: "9876543222",
    location: "Bangalore, India",
    password: "doctor123",
    role: "doctor",
    specialization: "Orthopedic",
    experience: "10 years",
    rating: 4.7,
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400"
  },
  {
    id: "DOC004",
    name: "Dr. Priya Patel",
    email: "dr.priya@hospital.com",
    mobile: "9876543223",
    location: "Ahmedabad, India",
    password: "doctor123",
    role: "doctor",
    specialization: "Dermatologist",
    experience: "8 years",
    rating: 4.6,
    profileImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400"
  }
];


export const todayStats: TodayStats = {
  total: 12,
  completed: 5,
  pending: 4,
  cancelled: 3,
};

export const weeklyAppointments: WeeklyAppointment[] = [
  {
    id: 1,
    day: "Monday",
    date: "28 Oct",
    count: 8,
    slots: [
      {
        time: "09:00 AM",
        patient: "Sarah Johnson",
        type: "Consultation",
        status: "Completed",
      },
      {
        time: "10:30 AM",
        patient: "Mike Wilson",
        type: "Follow-up",
        status: "Completed",
      },
      {
        time: "02:00 PM",
        patient: "Emily Davis",
        type: "Check-up",
        status: "Pending",
      },
    ],
  },
  {
    id: 2,
    day: "Tuesday",
    date: "29 Oct",
    count: 10,
    slots: [
      {
        time: "09:00 AM",
        patient: "Robert Brown",
        type: "Consultation",
        status: "Confirmed",
      },
      {
        time: "11:00 AM",
        patient: "Lisa Anderson",
        type: "Follow-up",
        status: "Confirmed",
      },
    ],
  },
  { id: 3, day: "Wednesday", date: "30 Oct", count: 12, slots: [] },
  { id: 4, day: "Thursday", date: "31 Oct", count: 9, slots: [] },
  { id: 5, day: "Friday", date: "01 Nov", count: 11, slots: [] },
  { id: 6, day: "Saturday", date: "02 Nov", count: 6, slots: [] },
  { id: 7, day: "Sunday", date: "03 Nov", count: 0, slots: [] },
];

export const cancelledAppointments: CancelledAppointment[] = [
  {
    id: 1,
    patient: "John Doe",
    date: "27 Oct 2024",
    time: "10:00 AM",
    reason: "Patient emergency",
    cancelledBy: "Patient",
    contact: "+1 234-567-8901",
  },
  {
    id: 2,
    patient: "Mary Smith",
    date: "26 Oct 2024",
    time: "02:30 PM",
    reason: "Scheduling conflict",
    cancelledBy: "Patient",
    contact: "+1 234-567-8902",
  },
  {
    id: 3,
    patient: "David Lee",
    date: "25 Oct 2024",
    time: "11:00 AM",
    reason: "Felt better",
    cancelledBy: "Patient",
    contact: "+1 234-567-8903",
  },
];

export const upcomingAppointments: UpcomingAppointment[] = [
  {
    id: 1,
    patient: "Alice Cooper",
    date: "28 Oct 2024",
    time: "02:00 PM",
    type: "Consultation",
    contact: "+1 234-567-8904",
  },
  {
    id: 2,
    patient: "Bob Martin",
    date: "29 Oct 2024",
    time: "09:00 AM",
    type: "Follow-up",
    contact: "+1 234-567-8905",
  },
  {
    id: 3,
    patient: "Carol White",
    date: "29 Oct 2024",
    time: "11:30 AM",
    type: "Check-up",
    contact: "+1 234-567-8906",
  },
  {
    id: 4,
    patient: "Daniel Green",
    date: "30 Oct 2024",
    time: "10:00 AM",
    type: "Emergency",
    contact: "+1 234-567-8907",
  },
];

export const recentPatients: RecentPatient[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    lastVisit: "27 Oct 2024",
    condition: "Hypertension",
  },
  {
    id: 2,
    name: "Mike Wilson",
    lastVisit: "27 Oct 2024",
    condition: "Regular Check-up",
  },
  {
    id: 3,
    name: "Emily Davis",
    lastVisit: "26 Oct 2024",
    condition: "Heart Monitoring",
  },
  {
    id: 4,
    name: "Robert Brown",
    lastVisit: "25 Oct 2024",
    condition: "Chest Pain",
  },
];

export const findUserByIdentifier = (identifier: string): MockUser | undefined => {
  const cleaned = identifier.trim().toLowerCase();
  return (
    mockUsers.find(
      user =>
        user.email?.toLowerCase() === cleaned || user.mobile === cleaned
    ) ||
    mockDoctors.find(
      doctor =>
        doctor.email?.toLowerCase() === cleaned || doctor.mobile === cleaned
    )
  );
};

export const isValidIdentifier = (identifier: string): boolean => {
  return !!findUserByIdentifier(identifier);
};

export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const otpStorage = new Map<string, { otp: string; timestamp: number }>();

export const storeOTP = (identifier: string, otp: string): void => {
  otpStorage.set(identifier, {
    otp,
    timestamp: Date.now()
  });
};

export const verifyOTP = (identifier: string, otp: string): boolean => {
  const stored = otpStorage.get(identifier);
  if (!stored) return false;
  
  const isExpired = Date.now() - stored.timestamp > 5 * 60 * 1000;
  if (isExpired) {
    otpStorage.delete(identifier);
    return false;
  }
  
  return stored.otp === otp;
};

export const clearOTP = (identifier: string): void => {
  otpStorage.delete(identifier);
};