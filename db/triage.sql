-- ============================================================
-- Phase 8: Advanced Clinical Triage Module
-- ============================================================

-- Table: triage_assessments
CREATE TABLE IF NOT EXISTS triage_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
    symptoms TEXT[] NOT NULL DEFAULT '{}',
    temperature DECIMAL(4,2),
    heart_rate INTEGER,
    blood_pressure_sys INTEGER,
    blood_pressure_dia INTEGER,
    pain_scale INTEGER CHECK (pain_scale >= 1 AND pain_scale <= 10),
    priority TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    status TEXT NOT NULL DEFAULT 'TRIAGED', -- TRIAGED, WAITING_FOR_DOCTOR, ASSIGNED_TO_DOCTOR, CONSULTED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: triage_rules
CREATE TABLE IF NOT EXISTS triage_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    conditions JSONB NOT NULL,
    priority TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: triage_audit_logs
CREATE TABLE IF NOT EXISTS triage_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triage_id UUID NOT NULL REFERENCES triage_assessments(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS for Triage
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view all triage assessments"
    ON triage_assessments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Nurses and Admins can insert triage assessments"
    ON triage_assessments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view triage rules"
    ON triage_rules FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view/insert triage audit logs"
    ON triage_audit_logs FOR ALL
    USING (auth.role() = 'authenticated');

-- Seed initial rules
INSERT INTO triage_rules (name, conditions, priority, department) VALUES
('Chest Pain Protocol', '{"symptoms": ["chest pain"]}', 'HIGH', 'Cardiology'),
('Respiratory Distrust', '{"symptoms": ["difficulty breathing"]}', 'HIGH', 'Emergency'),
('Severe Hypertension', '{"bp_sys": {"gt": 180}}', 'CRITICAL', 'Emergency'),
('Critical Tachycardia', '{"heart_rate": {"gt": 150}}', 'CRITICAL', 'Emergency'),
('Critical Bradycardia', '{"heart_rate": {"lt": 40}}', 'CRITICAL', 'Emergency'),
('Severe Hyperthermia', '{"temperature": {"gt": 40}}', 'CRITICAL', 'Emergency'),
('Routine Assessment', '{"symptoms": ["general checkup"]}', 'LOW', 'General Medicine');
