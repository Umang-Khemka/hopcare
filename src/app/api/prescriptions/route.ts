import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// ✅ Define the path to JSON storage file
const filePath = path.join(process.cwd(), "prescriptions.json");

// ✅ Helper: Read prescriptions file
async function loadPrescriptions(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

// ✅ Helper: Save prescriptions to file
async function savePrescriptions(prescriptions: any[]) {
  await fs.writeFile(filePath, JSON.stringify(prescriptions, null, 2), "utf8");
}

// ✅ Handle GET request (Fetch all or by appointmentId)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get("appointmentId");

  const prescriptions = await loadPrescriptions();

  if (appointmentId) {
    const filtered = prescriptions.filter((p) => p.appointmentId === appointmentId);
    return NextResponse.json({ success: true, prescriptions: filtered });
  }

  return NextResponse.json({ success: true, prescriptions });
}

// ✅ Handle POST request (Save new prescription)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, diagnosis, medicines, advice, followUp } = body;

    // DEBUG: Log incoming data
    console.log("📝 Received prescription data:", {
      appointmentId,
      diagnosis,
      medicines,
      advice,
      followUp
    });

    // Basic validation
    if (!appointmentId || !diagnosis || !medicines) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate medicines array
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { success: false, error: "Medicines array is required" },
        { status: 400 }
      );
    }

    // Validate at least one medicine has name
    const hasValidMedicine = medicines.some((med) => med.name && med.name.trim() !== "");
    if (!hasValidMedicine) {
      return NextResponse.json(
        { success: false, error: "At least one medicine name is required" },
        { status: 400 }
      );
    }

    // Load current prescriptions
    const prescriptions = await loadPrescriptions();

    // Check if prescription already exists for this appointment
    const existingIndex = prescriptions.findIndex(
      (p) => p.appointmentId === appointmentId
    );

    // Create new prescription object with ALL fields
    const newPrescription = {
      id: Date.now().toString(),
      appointmentId,
      diagnosis: diagnosis.trim(),
      medicines: medicines
        .filter(med => med.name && med.name.trim() !== "") // Filter out empty medicines
        .map(med => ({
          name: med.name.trim(),
          type: med.type?.trim() || "Tablet",
          dosage: med.dosage?.trim() || "",
          duration: med.duration?.trim() || "",
          frequency: med.frequency?.trim() || "",
          instructions: med.instructions?.trim() || "",
          // Backward compatibility
          days: med.days?.trim() || med.duration?.trim() || "",
          timesPerDay: med.timesPerDay?.trim() || med.frequency?.trim() || ""
        })),
      advice: (advice || "").trim(),
      followUp: (followUp || "").trim(),
      createdAt: new Date().toISOString(),
    };

    // Update existing or add new
    if (existingIndex !== -1) {
      prescriptions[existingIndex] = newPrescription;
    } else {
      prescriptions.push(newPrescription);
    }

    // Save back to file
    await savePrescriptions(prescriptions);

    // DEBUG: Log saved data
    console.log("💾 Saved prescription:", newPrescription);

    return NextResponse.json({
      success: true,
      message: "Prescription saved successfully",
      data: newPrescription,
    });
  } catch (err) {
    console.error("❌ Error saving prescription:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ Handle PUT request (Update prescription)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, diagnosis, medicines, advice, followUp } = body;

    const prescriptions = await loadPrescriptions();
    const index = prescriptions.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Update prescription
    prescriptions[index] = {
      ...prescriptions[index],
      diagnosis: diagnosis || prescriptions[index].diagnosis,
      medicines: medicines || prescriptions[index].medicines,
      advice: advice || prescriptions[index].advice,
      followUp: followUp || prescriptions[index].followUp,
      updatedAt: new Date().toISOString(),
    };

    await savePrescriptions(prescriptions);

    return NextResponse.json({
      success: true,
      message: "Prescription updated successfully",
      data: prescriptions[index],
    });
  } catch (err) {
    console.error("Error updating prescription:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}