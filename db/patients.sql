-- ============================================================
-- Phase 2: Patient Management Tables
-- ============================================================

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    insurance_details TEXT,
    status TEXT DEFAULT 'active',
    assigned_doctor TEXT,
    condition TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Patient Intake records
CREATE TABLE patient_intake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    symptoms TEXT,
    vitals JSONB,
    status TEXT DEFAULT 'pending',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_intake ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read patients
CREATE POLICY "Authenticated users can view patients."
    ON patients FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients."
    ON patients FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients."
    ON patients FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage intake records
CREATE POLICY "Authenticated users can view intake."
    ON patient_intake FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert intake."
    ON patient_intake FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Seed data for patients
INSERT INTO patients (name, dob, gender, phone, email, insurance_details, status, assigned_doctor, condition) VALUES
('Sarah Johnson', '1985-03-15', 'Female', '+1 (555) 123-4567', 'sarah.johnson@email.com', 'BlueCross PPO #BC-789456', 'active', 'Dr. Smith', 'Hypertension'),
('Michael Chen', '1990-07-22', 'Male', '+1 (555) 234-5678', 'michael.chen@email.com', 'Aetna HMO #AE-456123', 'active', 'Dr. Patel', 'Type 2 Diabetes'),
('Emily Davis', '1978-11-08', 'Female', '+1 (555) 345-6789', 'emily.davis@email.com', 'UnitedHealth #UH-321654', 'critical', 'Dr. Williams', 'Cardiac Arrhythmia'),
('James Wilson', '1995-01-30', 'Male', '+1 (555) 456-7890', 'james.wilson@email.com', 'Cigna PPO #CG-654987', 'active', 'Dr. Smith', 'Asthma'),
('Maria Garcia', '1982-06-14', 'Female', '+1 (555) 567-8901', 'maria.garcia@email.com', 'Medicare #MC-147258', 'discharged', 'Dr. Lee', 'Post-op Recovery'),
('Robert Taylor', '1988-09-03', 'Male', '+1 (555) 678-9012', 'robert.taylor@email.com', 'Humana PPO #HM-258369', 'active', 'Dr. Patel', 'Migraine'),
('Lisa Anderson', '1975-12-20', 'Female', '+1 (555) 789-0123', 'lisa.anderson@email.com', 'Kaiser #KP-369147', 'active', 'Dr. Williams', 'Arthritis'),
('David Martinez', '1992-04-17', 'Male', '+1 (555) 890-1234', 'david.martinez@email.com', 'BlueCross HMO #BC-741852', 'critical', 'Dr. Smith', 'Pneumonia'),
('Jennifer Brown', '1987-08-09', 'Female', '+1 (555) 901-2345', 'jennifer.brown@email.com', 'Aetna PPO #AE-852963', 'active', 'Dr. Lee', 'Anxiety Disorder'),
('William Thomas', '1970-02-28', 'Male', '+1 (555) 012-3456', 'william.thomas@email.com', 'UnitedHealth #UH-963741', 'active', 'Dr. Patel', 'COPD'),
('Amanda White', '1993-10-05', 'Female', '+1 (555) 123-7890', 'amanda.white@email.com', 'Cigna HMO #CG-159753', 'discharged', 'Dr. Williams', 'Allergy Management'),
('Christopher Lee', '1980-05-12', 'Male', '+1 (555) 234-8901', 'christopher.lee@email.com', 'Medicare #MC-357159', 'active', 'Dr. Lee', 'Lower Back Pain');

-- Seed intake data
INSERT INTO patient_intake (patient_id, symptoms, vitals, status, created_by) VALUES
((SELECT id FROM patients WHERE name = 'Sarah Johnson'), 'Persistent headaches, elevated blood pressure readings at home', '{"bp": "145/92", "hr": "78", "temp": "98.6", "weight": "165"}', 'completed', NULL),
((SELECT id FROM patients WHERE name = 'Sarah Johnson'), 'Follow-up visit, dizziness reported', '{"bp": "138/88", "hr": "82", "temp": "98.4", "weight": "163"}', 'completed', NULL),
((SELECT id FROM patients WHERE name = 'Michael Chen'), 'Increased thirst, frequent urination, fatigue', '{"bp": "130/85", "hr": "72", "temp": "98.8", "glucose": "210", "weight": "195"}', 'completed', NULL),
((SELECT id FROM patients WHERE name = 'Emily Davis'), 'Chest palpitations, shortness of breath during exertion', '{"bp": "118/76", "hr": "110", "temp": "98.2", "spo2": "94%", "weight": "140"}', 'in_progress', NULL);
