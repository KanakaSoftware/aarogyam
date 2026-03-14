import { createClient } from '@/lib/supabase/server';
import { IntakeState, IntakeWorkflow, WorkflowTransition, RoleName } from '@/types';

export class WorkflowService {
    /**
     * Define allowed transitions for each role.
     */
    private static ALLOWED_TRANSITIONS: Record<RoleName, Partial<Record<IntakeState, IntakeState[]>>> = {
        receptionist: {
            'DRAFT': ['SUBMITTED'],
        },
        nurse: {
            'SUBMITTED': ['TRIAGE_PENDING'],
            'TRIAGE_PENDING': ['TRIAGED'],
        },
        doctor: {
            'TRIAGED': ['ASSIGNED_TO_DOCTOR'],
            'ASSIGNED_TO_DOCTOR': ['CONSULTED'],
            'CONSULTED': ['TREATMENT_STARTED', 'FOLLOW_UP_REQUIRED'],
            'TREATMENT_STARTED': ['COMPLETED'],
            'FOLLOW_UP_REQUIRED': ['DRAFT', 'SUBMITTED'], // Re-entry
        },
        admin: {
            // Admins can do anything
            'DRAFT': ['SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'SUBMITTED': ['DRAFT', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'TRIAGE_PENDING': ['DRAFT', 'SUBMITTED', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'TRIAGED': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'ASSIGNED_TO_DOCTOR': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'CONSULTED': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'TREATMENT_STARTED': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED'],
            'COMPLETED': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'FOLLOW_UP_REQUIRED'],
            'FOLLOW_UP_REQUIRED': ['DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED'],
        },
        specialist: {},
        lab_technician: {},
        billing_officer: {},
        compliance_officer: {},
        patient: {},
    };

    /**
     * Get the current workflow for an intake.
     */
    static async getWorkflowByIntakeId(intakeId: string): Promise<IntakeWorkflow | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('intake_workflow')
            .select('*')
            .eq('intake_id', intakeId)
            .single();

        if (error) return null;
        return data as IntakeWorkflow;
    }

    /**
     * Create an initial workflow for a new intake.
     */
    static async createWorkflow(intakeId: string, patientId: string): Promise<IntakeWorkflow> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('intake_workflow')
            .insert({
                intake_id: intakeId,
                patient_id: patientId,
                current_state: 'DRAFT',
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create workflow: ${error.message}`);

        // Log initial state
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('users').select('role').eq('id', user?.id).single();

        await this.logTransition(intakeId, data.id, null, 'DRAFT', user?.id || '', (profile?.role as RoleName) || 'receptionist', 'Initial intake draft');

        return data as IntakeWorkflow;
    }

    /**
     * Transition the state of an intake workflow.
     */
    static async transitionState(
        intakeId: string,
        newState: IntakeState,
        notes?: string
    ): Promise<IntakeWorkflow> {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        const role = profile?.role as RoleName;

        const workflow = await this.getWorkflowByIntakeId(intakeId);
        if (!workflow) throw new Error('Workflow not found');

        const currentState = workflow.current_state;

        // Validate transition
        const allowed = this.ALLOWED_TRANSITIONS[role]?.[currentState] || [];
        if (!allowed.includes(newState) && role !== 'admin') {
            throw new Error(`Role ${role} is not allowed to transition from ${currentState} to ${newState}`);
        }

        // Update state
        const { data: updatedWorkflow, error } = await supabase
            .from('intake_workflow')
            .update({ current_state: newState })
            .eq('id', workflow.id)
            .select()
            .single();

        if (error) throw new Error(`Failed to transition state: ${error.message}`);

        // Log transition
        await this.logTransition(intakeId, workflow.id, currentState, newState, user.id, role, notes);

        return updatedWorkflow as IntakeWorkflow;
    }

    /**
     * Log a transition to the audit log.
     */
    private static async logTransition(
        intakeId: string,
        workflowId: string,
        previousState: IntakeState | null,
        newState: IntakeState,
        performedBy: string,
        role: RoleName,
        notes?: string
    ): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase.from('intake_workflow_audit_log').insert({
            intake_id: intakeId,
            workflow_id: workflowId,
            previous_state: previousState,
            new_state: newState,
            performed_by: performedBy,
            role,
            notes,
        });

        if (error) {
            console.error('Failed to log workflow transition:', error.message);
        }
    }

    /**
     * Get the workflow history for an intake.
     */
    static async getWorkflowHistory(intakeId: string): Promise<WorkflowTransition[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('intake_workflow_audit_log')
            .select('*')
            .eq('intake_id', intakeId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch history: ${error.message}`);
        return data as WorkflowTransition[];
    }

    /**
     * Fetch the triage queue (SUBMITTED or TRIAGE_PENDING).
     */
    static async getTriageQueue(): Promise<any[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('intake_workflow')
            .select(`
                *,
                patients (name, dob),
                patient_intake (symptoms, created_at)
            `)
            .in('current_state', ['SUBMITTED', 'TRIAGE_PENDING'])
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch triage queue: ${error.message}`);
        return data;
    }

    /**
     * Fetch assigned patients for a doctor.
     */
    static async getDoctorAssignments(doctorId: string): Promise<any[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('intake_workflow')
            .select(`
                *,
                patients (name, dob),
                patient_intake (symptoms, created_at)
            `)
            .eq('assigned_doctor_id', doctorId)
            .not('current_state', 'eq', 'COMPLETED')
            .order('priority', { ascending: false });

        if (error) throw new Error(`Failed to fetch doctor assignments: ${error.message}`);
        return data;
    }
}
