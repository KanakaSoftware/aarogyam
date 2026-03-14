import { NextRequest, NextResponse } from "next/server";
import { WorkflowService } from "@/services/workflow.service";

/**
 * GET /api/triage-queue
 * Fetch all patients waiting for triage.
 */
export async function GET(_request: NextRequest) {
    try {
        const queue = await WorkflowService.getTriageQueue();
        return NextResponse.json(queue);
    } catch (error: unknown) {
        console.error("Error fetching triage queue:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
