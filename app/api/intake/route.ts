import { NextRequest, NextResponse } from "next/server";
import { PatientService } from "@/services/patient.service";
import { WorkflowService } from "@/services/workflow.service";
import { intakeSchema } from "@/lib/validations/patient";
import { ZodError } from "zod";

/**
 * POST /api/intake
 * Create a new intake record and initialize workflow.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patientId, ...data } = body;

        if (!patientId) {
            return NextResponse.json({ error: "patientId is required" }, { status: 400 });
        }

        // Validate input
        const validatedData = intakeSchema.parse(data);

        // 1. Create intake record (existing service)
        const intake = await PatientService.createIntake(patientId, validatedData);

        // 2. Initialize workflow (new service)
        await WorkflowService.createWorkflow(intake.id, patientId);

        return NextResponse.json(intake, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating intake:", error);
        if (error instanceof ZodError) {
            return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 });
        }
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
