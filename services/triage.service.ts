import { createClient } from '@/lib/supabase/server';
import { TriageAssessment, TriageRule, TriageAuditLog } from '@/types';
import { TriageEngine, TriageInput } from '@/lib/triage/engine';

export class TriageService {
    /**
     * Validate if a user exists in public.users to avoid FK violations.
     */
    public static async validateUser(userId?: string): Promise<string | undefined> {
        if (!userId) return undefined;
        const supabase = await createClient();
        const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
        
        if (!profile) {
            console.warn(`User profile not found for id: ${userId}.`);
            return undefined;
        }
        return userId;
    }

    /**
     * Perform a clinical triage assessment.
     */
    static async createAssessment(data: {
        patient_id: string;
        nurse_id?: string;
        symptoms: string[];
        temperature?: number;
        heart_rate?: number;
        blood_pressure_sys?: number;
        blood_pressure_dia?: number;
        pain_scale?: number;
        notes?: string;
    }): Promise<TriageAssessment> {
        const supabase = await createClient();

        // 0. Ensure user profile exists (Resilience fix for nurse_id FK violation)
        const validatedNurseId = await this.validateUser(data.nurse_id);

        // 1. Fetch active rules
        const { data: rules } = await supabase
            .from('triage_rules')
            .select('*')
            .eq('is_active', true);

        // 2. Evaluate using TriageEngine
        const triageInput: TriageInput = {
            symptoms: data.symptoms,
            vitals: {
                temperature: data.temperature,
                heart_rate: data.heart_rate,
                bp_sys: data.blood_pressure_sys,
                bp_dia: data.blood_pressure_dia
            },
            pain_scale: data.pain_scale
        };

        const evaluation = TriageEngine.evaluate(triageInput, rules as TriageRule[] || []);

        // 3. Create assessment record
        const { data: assessment, error } = await supabase
            .from('triage_assessments')
            .insert({
                patient_id: data.patient_id,
                nurse_id: validatedNurseId,
                symptoms: data.symptoms,
                temperature: data.temperature,
                heart_rate: data.heart_rate,
                blood_pressure_sys: data.blood_pressure_sys,
                blood_pressure_dia: data.blood_pressure_dia,
                pain_scale: data.pain_scale,
                priority: evaluation.priority,
                status: 'TRIAGED',
                notes: data.notes || evaluation.reason.join(' | ')
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to save triage assessment: ${error.message}`);

        // 4. Initial audit log
        await supabase.from('triage_audit_logs').insert({
            triage_id: assessment.id,
            action: 'CREATED',
            performed_by: validatedNurseId,
            new_value: assessment
        });

        return assessment as TriageAssessment;
    }

    /**
     * Fetch active triage assessment for a patient
     */
    static async getLatestAssessment(patientId: string): Promise<TriageAssessment | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('triage_assessments')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as TriageAssessment;
    }

    /**
     * Get the current triage queue
     */
    static async getQueue(): Promise<any[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('triage_assessments')
            .select(`
                *,
                patients (id, name, gender, dob)
            `)
            .in('status', ['TRIAGED', 'WAITING_FOR_DOCTOR'])
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Assign a doctor to a triage assessment.
     */
    static async assignDoctor(assessmentId: string, doctorId: string, performerId?: string): Promise<any> {
        const supabase = await createClient();
        
        // Validate performer to avoid FK error in audit log
        const validatedPerformerId = await this.validateUser(performerId);

        // Fetch current to log in audit
        const { data: current } = await supabase
            .from('triage_assessments')
            .select('status, notes')
            .eq('id', assessmentId)
            .single();

        if (!current) throw new Error("Assessment not found");

        // Update assessment
        const { data: assessment, error } = await supabase
            .from('triage_assessments')
            .update({
                status: 'ASSIGNED_TO_DOCTOR',
                notes: (current.notes || '') + ` | Assigned to Doctor: ${doctorId}`
            })
            .eq('id', assessmentId)
            .select()
            .single();

        if (error) throw error;

        // Audit Log
        await supabase.from('triage_audit_logs').insert({
            triage_id: assessmentId,
            action: 'ASSIGNED_DOCTOR',
            performed_by: validatedPerformerId,
            old_value: { status: current.status },
            new_value: { status: 'ASSIGNED_TO_DOCTOR', doctor_id: doctorId }
        });

        return assessment;
    }
}
