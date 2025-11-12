import { NextResponse } from "next/server";
import { Appointment, AppointmentRequest, AppointmentResponse } from "@/src/types";
import { appointments } from "@/src/data/appointmentsStore";

// ✅ GET — Fetch appointments (flexible)
export async function GET(req: Request): Promise<NextResponse<AppointmentResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");
    const status = searchParams.get("status");

    // 🔹 Case 1 — Specific appointment by ID
    if (id) {
      const appointment = appointments.find((a) => a.id === id);
      if (!appointment)
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

      return NextResponse.json({ success: true, appointment }, { status: 200 });
    }

    // 🔹 Case 2 — Doctor's appointments for specific date
    if (doctorId && date) {
      const bookedAppointments = appointments.filter(
        (a) => a.doctorId === doctorId && a.date === date
      );
      return NextResponse.json({ success: true, appointments: bookedAppointments }, { status: 200 });
    }
if (doctorId && status) {
      const filteredAppointments = appointments.filter(
        (a) => a.doctorId === doctorId && a.status === status
      );
      return NextResponse.json({ success: true, appointments: filteredAppointments }, { status: 200 });
    }

    // 🔹 Case 3 — User's all appointments
    if (userId) {
      const userAppointments = appointments.filter((a) => a.userId === userId);
      return NextResponse.json({ success: true, appointments: userAppointments }, { status: 200 });
    }

    // 🔹 Case 4 — Filter by status
    if (status) {
      const statusAppointments = appointments.filter((a) => a.status === status);
      return NextResponse.json({ success: true, appointments: statusAppointments }, { status: 200 });
    }

    // 🔹 Case 5 — Doctor's all appointments (for calendar)
    if (doctorId) {
      const doctorAppointments = appointments.filter((a) => a.doctorId === doctorId);
      return NextResponse.json({ success: true, appointments: doctorAppointments }, { status: 200 });
    }

    // 🔹 Case 6 — Default: return all appointments (for reports)
    return NextResponse.json({ success: true, appointments }, { status: 200 });

  } catch (error: any) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// ✅ POST — Book a new appointment
export async function POST(req: Request): Promise<NextResponse<AppointmentResponse>> {
  try {
    const body: AppointmentRequest = await req.json();
    const { doctorId, userId, date, time, patientAge, patientName, symptoms } = body;

    if (!doctorId || !userId || !date || !time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const alreadyBooked = appointments.find(
      (a) => a.doctorId === doctorId && a.date === date && a.time === time
    );

    if (alreadyBooked) {
      return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
    }

    const newBooking: Appointment = {
      id: crypto.randomUUID(),
      doctorId,
      userId,
      patientAge,
      patientName,
      symptoms,
      date,
      time,
      status: "booked",
      rescheduleCount: 0, // ✅ Initial reschedule count 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), // ✅ Add updatedAt field
    };

    appointments.push(newBooking);

    return NextResponse.json(
      { success: true, message: "Slot booked successfully", booking: newBooking },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to book slot" }, { status: 500 });
  }
}

// ✅ PUT — Update appointment (reschedule or status)
export async function PUT(req: Request): Promise<NextResponse<AppointmentResponse>> {
  try {
    const body = await req.json();
    const { appointmentId, status, date, time, isReschedule } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    const index = appointments.findIndex((a) => a.id === appointmentId);
    if (index === -1) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // 🔹 Track original values for comparison
    const originalDate = appointments[index].date;
    const originalTime = appointments[index].time;
    let isActuallyRescheduled = false;

    // 🔹 If rescheduling (changing date/time)
    if (date && time) {
      // Check if the new slot is already booked by someone else
      const conflict = appointments.find(
        (a) =>
          a.doctorId === appointments[index].doctorId &&
          a.date === date &&
          a.time === time &&
          a.id !== appointmentId
      );

      if (conflict) {
        return NextResponse.json({ error: "That slot is already booked" }, { status: 409 });
      }

      // ✅ Check if date/time actually changed
      if (originalDate !== date || originalTime !== time) {
        isActuallyRescheduled = true;
      }

      // ✅ Reschedule count increment karo agar reschedule ho raha hai
      if (isReschedule || isActuallyRescheduled) {
        appointments[index].rescheduleCount = (appointments[index].rescheduleCount || 0) + 1;
      }

      // Update date and time
      appointments[index].date = date;
      appointments[index].time = time;
      appointments[index].status = "booked";
      
      // ✅ Always update the updatedAt timestamp when date/time changes
      appointments[index].updatedAt = new Date().toISOString();
    }

    // 🔹 If updating status
    if (status) {
      const validStatuses = ["booked", "cancelled", "completed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      appointments[index].status = status;
      // ✅ Update timestamp when status changes too
      appointments[index].updatedAt = new Date().toISOString();
    }

    // ✅ Return success with updated appointment
    const responseMessage = isActuallyRescheduled 
      ? "Appointment rescheduled successfully" 
      : "Appointment updated successfully";

    return NextResponse.json({
      success: true,
      message: responseMessage,
      appointment: appointments[index],
      isRescheduled: isActuallyRescheduled, // ✅ Frontend ko batao ki reschedule hua hai
    });
  } catch (error: any) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}