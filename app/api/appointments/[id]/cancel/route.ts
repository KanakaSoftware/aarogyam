import { NextResponse } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { UserService } from "@/services/user.service";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await UserService.getCurrentUser();
        if (!user || user.role !== 'receptionist' && user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await AppointmentService.cancelAppointment(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("PATCH /api/appointments/[id]/cancel error:", error);
        return NextResponse.json({ error: error.message || "Failed to cancel appointment" }, { status: 400 });
    }
}
