import { NextRequest, NextResponse } from "next/server";
import { WorkflowService } from "@/services/workflow.service";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/doctor/assigned-patients
 * Fetch patients assigned to the current doctor.
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const assignments = await WorkflowService.getDoctorAssignments(user.id);
        return NextResponse.json(assignments);
    } catch (error: unknown) {
        console.error("Error fetching doctor assignments:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
