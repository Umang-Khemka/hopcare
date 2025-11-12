import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "prescriptions.json");

async function loadPrescriptions(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

async function savePrescriptions(prescriptions: any[]) {
  await fs.writeFile(filePath, JSON.stringify(prescriptions, null, 2), "utf8");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    const prescriptions = await loadPrescriptions();
    const index = prescriptions.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    prescriptions[index] = {
      ...prescriptions[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await savePrescriptions(prescriptions);

    return NextResponse.json({ success: true, data: prescriptions[index] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update prescription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    let prescriptions = await loadPrescriptions();
    const index = prescriptions.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    prescriptions.splice(index, 1);
    await savePrescriptions(prescriptions);

    return NextResponse.json({ success: true, message: "Prescription deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete prescription" },
      { status: 500 }
    );
  }
}
