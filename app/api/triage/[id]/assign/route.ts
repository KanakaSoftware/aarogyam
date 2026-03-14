import { NextRequest, NextResponse } from "next/server";
import { TriageService } from "@/services/triage.service";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/triage/[id]/assign
 * Assign a doctor to a triage assessment and update status.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { doctor_id } = await request.json();

        if (!doctor_id) {
            return NextResponse.json({ error: "doctor_id is required" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const assessment = await TriageService.assignDoctor(id, doctor_id, user?.id);

        return NextResponse.json(assessment);
    } catch (error: any) {
        console.error("Assignment API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
