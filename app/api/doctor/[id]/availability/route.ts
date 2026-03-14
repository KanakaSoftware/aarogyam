import { NextResponse } from "next/server";
import { AppointmentService } from "@/services/appointment.service";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const availability = await AppointmentService.getDoctorAvailability(id);
        return NextResponse.json(availability);
    } catch (error: any) {
        console.error("GET /api/doctor/[id]/availability error:", error);
        return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
    }
}
