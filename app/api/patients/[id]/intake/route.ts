import { NextRequest, NextResponse } from "next/server";
import { PatientService } from "@/services/patient.service";
import { AuditService } from "@/services/audit.service";
import { intakeSchema } from "@/lib/validations/patient";
import { ZodError } from "zod";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validatedData = intakeSchema.parse(body);

        // Create intake record
        const intake = await PatientService.createIntake(id, validatedData);

        // Log the action
        await AuditService.logAction(
            "create_intake",
            "patient",
            id,
            { intakeId: intake.id, symptoms: validatedData.symptoms }
        );

        return NextResponse.json(intake, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating intake record:", error);
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation Error", details: error.issues },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
