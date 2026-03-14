import { NextRequest, NextResponse } from "next/server";
import { TriageService } from "@/services/triage.service";

/**
 * POST /api/intake/[id]/triage
 * Perform triage for a patient intake session.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { symptoms, vitals, notes } = await request.json();

        if (!symptoms) {
            return NextResponse.json({ error: "symptoms is required" }, { status: 400 });
        }

        const workflow = await TriageService.performTriage(id, symptoms, vitals, notes);

        return NextResponse.json(workflow);
    } catch (error: unknown) {
        console.error("Error performing triage:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
