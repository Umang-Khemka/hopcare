import { NextResponse } from "next/server";
import { Appointment,AppointmentResponse } from "@/src/types";
import { appointments } from "@/src/data/appointmentsStore";

export async function GET(req: Request): Promise<NextResponse<AppointmentResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const userAppointments = appointments.filter((a) => a.userId === userId);

    return NextResponse.json({ appointments: userAppointments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user appointments" },
      { status: 500 }
    );
  }
}