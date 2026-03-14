export type RoleName =
  | 'admin'
  | 'receptionist'
  | 'nurse'
  | 'doctor'
  | 'specialist'
  | 'lab_technician'
  | 'billing_officer'
  | 'compliance_officer'
  | 'patient';

export type Department =
  | 'Cardiology'
  | 'Emergency'
  | 'General Medicine'
  | 'Surgery'
  | 'Pediatrics'
  | 'Radiology'
  | 'Pathology'
  | 'Pharmacy'
  | 'ICU'
  | 'Billing'
  | 'Administration'
  | 'Nursing'
  | 'Laboratory';

export type UserStatus = 'active' | 'inactive';

export interface Role {
  name: RoleName;
  description: string;
}

export interface User {
  id: string; // References auth.users
  email: string;
  role: RoleName;
  first_name?: string | null;
  last_name?: string | null;
  department?: Department | string | null;
  status?: UserStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  timestamp: string;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
}

export type PatientStatus = 'active' | 'critical' | 'discharged';

export interface Patient {
  id: string;
  name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  insurance_details: string | null;
  status: PatientStatus;
  assigned_doctor: string | null;
  condition: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface PatientIntake {
  id: string;
  patient_id: string;
  symptoms: string | null;
  vitals: Record<string, string> | null;
  status: string;
  created_by: string | null;
  created_at: string;
  workflow?: Partial<IntakeWorkflow> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export type IntakeState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TRIAGE_PENDING'
  | 'TRIAGED'
  | 'ASSIGNED_TO_DOCTOR'
  | 'CONSULTED'
  | 'TREATMENT_STARTED'
  | 'COMPLETED'
  | 'FOLLOW_UP_REQUIRED';

export interface IntakeWorkflow {
  id: string;
  intake_id: string;
  patient_id: string;
  current_state: IntakeState;
  assigned_doctor_id: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_SET';
  created_at: string;
  updated_at: string;
}

export interface WorkflowTransition {
  id: string;
  intake_id: string;
  workflow_id: string;
  previous_state: IntakeState | null;
  new_state: IntakeState;
  performed_by: string;
  role: RoleName;
  notes?: string;
  created_at: string;
}

export interface TriageRule {
  id: string;
  name: string;
  conditions: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TriageAssessment {
  id: string;
  patient_id: string;
  nurse_id?: string | null;
  symptoms: string[];
  temperature?: number | null;
  heart_rate?: number | null;
  blood_pressure_sys?: number | null;
  blood_pressure_dia?: number | null;
  pain_scale?: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TRIAGED' | 'WAITING_FOR_DOCTOR' | 'ASSIGNED_TO_DOCTOR' | 'CONSULTED';
  notes?: string | null;
  created_at: string;
}

export interface TriageAuditLog {
  id: string;
  triage_id: string;
  action: string;
  performed_by?: string | null;
  old_value?: any;
  new_value?: any;
  timestamp: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
export type AppointmentType = 'CHECKUP' | 'FOLLOW_UP' | 'SURGERY' | 'EMERGENCY';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  room?: string | null;
  status: AppointmentStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  patients?: Patient;
  doctors?: User;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  available_day: number; // 0-6
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  room?: string | null;
  created_at: string;
  updated_at: string;
}

export type LabOrderStatus =
  | 'ORDERED'
  | 'SAMPLE_COLLECTED'
  | 'PROCESSING'
  | 'RESULT_UPLOADED'
  | 'DOCTOR_REVIEWED'
  | 'PATIENT_NOTIFIED';

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_name: string;
  status: LabOrderStatus;
  ordered_at: string;
  updated_at: string;
  // Joined fields
  patients?: Patient;
  doctors?: User;
  lab_results?: LabResult[];
  notes: string
}

export interface LabResult {
  id: string;
  lab_order_id: string;
  report_name: string;
  result_file_url: string;
  result_notes?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
}
