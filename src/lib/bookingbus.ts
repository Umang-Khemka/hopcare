"use client";

export type BookingPayload = {
  id: string;
  doctorId: string;
  patientName: string;
  time: string;
  date: string;
  status: "booked";
};

const CHANNEL = "appointment_channel";

// ✅ Create ONE shared channel only once (not on every call)
const bc = typeof window !== "undefined" ? new BroadcastChannel(CHANNEL) : null;

export function sendBooking(payload: BookingPayload) {
  bc?.postMessage(payload); // ✅ stays open
}

export function listenBooking(callback: (payload: BookingPayload) => void) {
  if (!bc) return () => {};
  const handler = (e: MessageEvent) => callback(e.data);
  bc.addEventListener("message", handler);
  return () => bc.removeEventListener("message", handler); // ✅ does not close channel
}
