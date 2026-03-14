import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/services/patient.service';
import { createPatientSchema, patientSearchSchema } from '@/lib/validations/patient';
import { AuditService } from '@/services/audit.service';

// GET /api/patients — paginated list with search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const params = patientSearchSchema.parse({
            search: searchParams.get('search') || undefined,
            dob: searchParams.get('dob') || undefined,
            patientId: searchParams.get('patientId') || undefined,
            page: searchParams.get('page') || 1,
            limit: searchParams.get('limit') || 10,
        });

        const result = await PatientService.getPatients(params);
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch patients';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/patients — create a new patient
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = createPatientSchema.parse(body);

        const patient = await PatientService.createPatient(validated);

        await AuditService.logAction('Created Patient', 'Patient', patient.id, {
            name: patient.name,
        });

        return NextResponse.json(patient, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create patient';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
