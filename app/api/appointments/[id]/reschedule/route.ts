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

        const { new_time } = await req.json();
        if (!new_time) return NextResponse.json({ error: "New time is required" }, { status: 400 });

        const appointment = await AppointmentService.rescheduleAppointment(id, new_time);
        return NextResponse.json(appointment);
    } catch (error: any) {
        console.error("PATCH /api/appointments/[id]/reschedule error:", error);
        return NextResponse.json({ error: error.message || "Failed to reschedule appointment" }, { status: 400 });
    }
}
