import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/services/patient.service';
import { updatePatientSchema } from '@/lib/validations/patient';
import { AuditService } from '@/services/audit.service';

// GET /api/patients/[id] — get single patient with intake
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await PatientService.getPatientById(id);

        if (!result) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch patient';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PUT /api/patients/[id] — update patient
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updatePatientSchema.parse(body);

        const patient = await PatientService.updatePatient(id, validated);

        await AuditService.logAction('Updated Patient', 'Patient', patient.id, {
            name: patient.name,
        });

        return NextResponse.json(patient);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update patient';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

// DELETE /api/patients/[id] — soft delete patient
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch patient name for audit log before deleting
        const result = await PatientService.getPatientById(id);
        if (!result) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        await PatientService.softDeletePatient(id);

        await AuditService.logAction('Deleted Patient', 'Patient', id, {
            name: result.patient.name,
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete patient';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
