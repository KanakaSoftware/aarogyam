import { NextResponse } from "next/server";
import { LabService } from "@/services/lab.service";
import { UserService } from "@/services/user.service";

export async function GET(req: Request) {
    try {
        const user = await UserService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status") || undefined;
        const search = searchParams.get("search") || undefined;
        const patient_id = searchParams.get("patient_id") || undefined;
        const doctor_id = searchParams.get("doctor_id") || undefined;

        const data = await LabService.getLabOrders({
            page,
            limit,
            status,
            search,
            patient_id,
            doctor_id
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/lab-orders error:", error);
        return NextResponse.json({ error: "Failed to fetch lab orders", details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await UserService.getCurrentUser();
        if (!user || user.role !== 'doctor' && user.role !== 'admin' && user.role !== 'specialist') {
            return NextResponse.json({ error: "Unauthorized to order a lab test" }, { status: 403 });
        }

        const body = await req.json();

        // Input validation
        if (!body.patient_id || !body.test_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newOrder = await LabService.createLabOrder({
            patient_id: body.patient_id,
            doctor_id: body.doctor_id || user.id, // Use selected doctor or current user
            test_name: body.test_name,
            notes: body.notes
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/lab-orders error:", error);
        return NextResponse.json({ error: "Failed to create lab order", details: error.message }, { status: 500 });
    }
}
