import { NextResponse } from "next/server";
import { LabService } from "@/services/lab.service";
import { UserService } from "@/services/user.service";

export async function POST(req: Request) {
    try {
        const user = await UserService.getCurrentUser();
        if (!user || user.role !== 'lab_technician' && user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized to upload lab results" }, { status: 403 });
        }

        const body = await req.json();

        if (!body.lab_order_id || !body.result_file_url || !body.report_name) {
            return NextResponse.json({ error: "Missing required fields (lab_order_id, result_file_url, or report_name)" }, { status: 400 });
        }

        const newResult = await LabService.uploadLabResult({
            lab_order_id: body.lab_order_id,
            report_name: body.report_name,
            result_file_url: body.result_file_url,
            result_notes: body.result_notes,
            uploaded_by: user.id
        });

        return NextResponse.json(newResult, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/lab-results error:", error);
        return NextResponse.json({ error: "Failed to upload lab result", details: error.message }, { status: 500 });
    }
}
