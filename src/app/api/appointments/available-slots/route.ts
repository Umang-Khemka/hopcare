// app/api/appointments/available-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if date is in past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot select past dates for follow-up',
          availableSlots: []
        },
        { status: 400 }
      );
    }

    // Fetch doctor's existing appointments for the selected date
    let existingAppointments = [];
    try {
      const appointmentsRes = await fetch(
        `http://localhost:3000/api/appointments?doctorId=${doctorId}&date=${date}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        existingAppointments = data.appointments || [];
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Continue with empty appointments array
    }

    // Define all possible time slots (9 AM to 6 PM, 30-minute intervals)
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    // Filter out booked slots
    const bookedSlots = existingAppointments
      .filter((apt: any) => apt.status !== 'cancelled')
      .map((apt: any) => {
        // Handle both "HH:MM" and "HH:MM:SS" formats
        const time = apt.time;
        return time.length === 5 ? time : time.slice(0, 5);
      });

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    // Check if it's today and filter out past times
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    
    let finalAvailableSlots = availableSlots;
    
    if (selectedDate.toDateString() === today.toDateString()) {
      finalAvailableSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        // Only include slots that are in the future
        return hours > currentHours || (hours === currentHours && minutes > currentMinutes);
      });
    }

    return NextResponse.json({
      success: true,
      availableSlots: finalAvailableSlots,
      date,
      doctorId,
      totalSlots: allSlots.length,
      bookedSlots: bookedSlots.length,
      availableCount: finalAvailableSlots.length
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        availableSlots: []
      },
      { status: 500 }
    );
  }
}