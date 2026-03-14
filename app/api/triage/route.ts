import { NextRequest, NextResponse } from "next/server";
import { TriageService } from "@/services/triage.service";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/triage
 * Create a new clinical triage assessment.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        // Critical Validation
        if (!body.patient_id || !body.symptoms || !Array.isArray(body.symptoms)) {
            return NextResponse.json({ error: "Missing required fields: patient_id and symptoms[]" }, { status: 400 });
        }

        const assessment = await TriageService.createAssessment({
            patient_id: body.patient_id,
            nurse_id: user.id,
            symptoms: body.symptoms,
            temperature: body.temperature,
            heart_rate: body.heart_rate,
            blood_pressure_sys: body.blood_pressure_sys,
            blood_pressure_dia: body.blood_pressure_dia,
            pain_scale: body.pain_scale,
            notes: body.notes
        });

        return NextResponse.json(assessment);
    } catch (error: any) {
        console.error("Triage API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/triage
 * Fetch the current triage queue.
 */
export async function GET() {
    try {
        const queue = await TriageService.getQueue();
        return NextResponse.json(queue);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
