import { NextRequest, NextResponse } from "next/server";
import { WorkflowService } from "@/services/workflow.service";

/**
 * PATCH /api/intake/[id]/state
 * Transition the workflow state.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { state, notes } = await request.json();

        if (!state) {
            return NextResponse.json({ error: "newState is required" }, { status: 400 });
        }

        const workflow = await WorkflowService.transitionState(id, state, notes);

        return NextResponse.json(workflow);
    } catch (error: unknown) {
        console.error("Error transitioning state:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message.includes("not allowed") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
