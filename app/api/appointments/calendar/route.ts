import { NextResponse } from "next/server";
import { AppointmentService } from "@/services/appointment.service";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const start_date = searchParams.get("start") || undefined;
        const end_date = searchParams.get("end") || undefined;

        const appointments = await AppointmentService.getAppointments({
            start_date,
            end_date
        });

        // Grouping or formatting for calendar could be done here if needed
        // For now, return flat list as requested by implementation plan
        return NextResponse.json(appointments);
    } catch (error: any) {
        console.error("GET /api/appointments/calendar error:", error);
        return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
    }
}
