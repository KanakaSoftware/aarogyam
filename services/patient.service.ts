import { createClient } from '@/lib/supabase/server';
import { Patient, PatientIntake, PaginatedResponse, PatientStatus } from '@/types';

export class PatientService {
    /**
     * Create a new patient record.
     */
    static async createPatient(data: {
        name: string;
        dob?: string;
        gender?: string;
        phone?: string;
        email?: string;
        insurance_details?: string;
        status: PatientStatus;
        assigned_doctor?: string;
        condition?: string;
    }): Promise<Patient> {
        const supabase = await createClient();

        const { data: patient, error } = await supabase
            .from('patients')
            .insert({
                name: data.name,
                dob: data.dob || null,
                gender: data.gender || null,
                phone: data.phone || null,
                email: data.email || null,
                insurance_details: data.insurance_details || null,
                status: data.status,
                assigned_doctor: data.assigned_doctor || null,
                condition: data.condition || null,
                is_deleted: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating patient:', error);
            throw new Error(error.message);
        }

        return patient as Patient;
    }

    /**
     * Get paginated patient list with optional search/filter.
     */
    static async getPatients(params: {
        page?: number;
        limit?: number;
        search?: string;
        dob?: string;
        patientId?: string;
    }): Promise<PaginatedResponse<Patient>> {
        const supabase = await createClient();
        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        let query = supabase.from('patients').select('*', { count: 'exact' }).eq('is_deleted', false);

        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,condition.ilike.%${params.search}%`);
        }

        if (params.dob) {
            query = query.eq('dob', params.dob);
        }

        if (params.patientId) {
            query = query.eq('id', params.patientId);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching patients:', error);
            throw new Error(error.message);
        }

        return {
            data: (data || []) as Patient[],
            pagination: {
                page,
                limit,
                total: count || 0,
            },
        };
    }

    /**
     * Get a single patient by ID with their intake history.
     */
    static async getPatientById(
        id: string
    ): Promise<{ patient: Patient; intakeHistory: PatientIntake[] } | null> {
        const supabase = await createClient();

        const { data: patient, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching patient:', error);
            return null;
        }

        const { data: intakeHistory, error: intakeError } = await supabase
            .from('patient_intake')
            .select(`
                *,
                intake_workflow (
                    current_state,
                    priority,
                    assigned_doctor_id
                )
            `)
            .eq('patient_id', id)
            .order('created_at', { ascending: false });

        if (intakeError) {
            console.warn('Warning fetching intake history:', intakeError.message);
        }

        return {
            patient: patient as Patient,
            intakeHistory: (intakeHistory || []).map((intake: any) => ({
                ...intake,
                workflow: intake.intake_workflow?.[0] || null
            })) as any[],
        };
    }

    /**
     * Update a patient record.
     */
    static async updatePatient(
        id: string,
        data: Partial<{
            name: string;
            dob: string | null;
            gender: string | null;
            phone: string | null;
            email: string | null;
            insurance_details: string | null;
            status: PatientStatus;
            assigned_doctor: string | null;
            condition: string | null;
        }>
    ): Promise<Patient> {
        const supabase = await createClient();

        const { data: patient, error } = await supabase
            .from('patients')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating patient:', error);
            throw new Error(error.message);
        }

        return patient as Patient;
    }

    /**
     * Create a new intake record for a patient.
     */
    static async createIntake(patientId: string, data: {
        symptoms: string;
        vitals?: Record<string, string> | null;
        statusIndex?: string; // Compatibility with old schema if needed, but we'll use 'status'
        status: string;
    }): Promise<PatientIntake> {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        const { data: intake, error } = await supabase
            .from('patient_intake')
            .insert({
                patient_id: patientId,
                symptoms: data.symptoms,
                vitals: data.vitals || null,
                status: data.status,
                created_by: user?.email || 'System',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating intake:', error);
            throw new Error(error.message);
        }

        return intake as PatientIntake;
    }

    /**
     * Soft delete a patient.
     */
    static async softDeletePatient(id: string): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase
            .from('patients')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) {
            console.error('Error soft deleting patient:', error);
            throw new Error(error.message);
        }
    }
}
