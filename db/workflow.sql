-- ============================================================
-- Phase 3: Patient Intake Workflow Engine
-- ============================================================

-- Workflow States:
-- 1. DRAFT
-- 2. SUBMITTED
-- 3. TRIAGE_PENDING
-- 4. TRIAGED
-- 5. ASSIGNED_TO_DOCTOR
-- 6. CONSULTED
-- 7. TREATMENT_STARTED
-- 8. COMPLETED
-- 9. FOLLOW_UP_REQUIRED

-- Table: intake_workflow
CREATE TABLE intake_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES patient_intake(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    current_state TEXT NOT NULL DEFAULT 'DRAFT',
    assigned_doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'NOT_SET', -- LOW, MEDIUM, HIGH, CRITICAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: triage_rules
CREATE TABLE triage_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_type TEXT NOT NULL, -- e.g., 'symptoms'
    condition_value TEXT NOT NULL, -- e.g., 'chest pain'
    priority TEXT NOT NULL, -- e.g., 'HIGH'
    assign_doctor_role TEXT, -- e.g., 'Specialist', 'Doctor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: intake_workflow_audit_log
CREATE TABLE intake_workflow_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES patient_intake(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES intake_workflow(id) ON DELETE CASCADE,
    previous_state TEXT,
    new_state TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    role TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Seed basic triage rules
INSERT INTO triage_rules (condition_type, condition_value, priority, assign_doctor_role) VALUES
('symptoms', 'chest pain', 'HIGH', 'doctor'),
('symptoms', 'difficulty breathing', 'HIGH', 'doctor'),
('symptoms', 'fever', 'MEDIUM', 'nurse'),
('symptoms', 'routine checkup', 'LOW', 'nurse');

-- Row Level Security (RLS)
ALTER TABLE intake_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_workflow_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to interact with workflow
CREATE POLICY "Authenticated users can manage intake workflow."
    ON intake_workflow FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view triage rules."
    ON triage_rules FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view/insert workflow audit logs."
    ON intake_workflow_audit_log FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert workflow audit logs."
    ON intake_workflow_audit_log FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger to update updated_at for intake_workflow
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intake_workflow_updated_at
    BEFORE UPDATE ON intake_workflow
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
