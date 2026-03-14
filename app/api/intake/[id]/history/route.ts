import { NextRequest, NextResponse } from "next/server";
import { WorkflowService } from "@/services/workflow.service";

/**
 * GET /api/intake/[id]/history
 * Fetch the workflow transition history for an intake.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const history = await WorkflowService.getWorkflowHistory(id);
        return NextResponse.json(history);
    } catch (error: unknown) {
        console.error("Error fetching workflow history:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
