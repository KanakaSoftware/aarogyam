import { NextResponse } from "next/server";
import { AppointmentService } from "@/services/appointment.service";
import { UserService } from "@/services/user.service";

export async function POST(req: Request) {
    try {
        const user = await UserService.getCurrentUser();
        if (!user || user.role !== 'receptionist' && user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const appointment = await AppointmentService.createAppointment(body);

        return NextResponse.json(appointment);
    } catch (error: any) {
        console.error("POST /api/appointments error:", error);
        return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 400 });
    }
}

export async function GET(req: Request) {
    try {
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        let doctor_id = searchParams.get("doctor_id") || undefined;
        let patient_id = searchParams.get("patient_id") || undefined;
        const start_date = searchParams.get("start_date") || undefined;
        const end_date = searchParams.get("end_date") || undefined;

        // Role-based filtering
        if (currentUser.role === 'doctor') {
            // Doctors can only see their own appointments
            doctor_id = currentUser.id;
        } else if (currentUser.role === 'patient') {
            // Patients can only see their own appointments
            // We need to look up the patient record based on the user's email
            const res = await fetch(`${new URL(req.url).origin}/api/patients?search=${currentUser.email}`);
            const patients = await res.json();
            const patientRecord = patients.data?.find((p: any) => p.email === currentUser.email);
            
            if (!patientRecord) {
                return NextResponse.json([]); // No patient record found for this user
            }
            patient_id = patientRecord.id;
        } else if (currentUser.role !== 'admin' && currentUser.role !== 'receptionist') {
            // Other roles (nurse, lab_tech, etc.) might need specific permissions, 
            // but for now, we'll restrict them to empty unless they are "staff"
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        const appointments = await AppointmentService.getAppointments({
            doctor_id,
            patient_id,
            start_date,
            end_date
        });

        return NextResponse.json(appointments);
    } catch (error: any) {
        console.error("GET /api/appointments error:", error);
        return NextResponse.json({
            error: "Failed to fetch appointments",
            details: error.message
        }, { status: 500 });
    }
}
