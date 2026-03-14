-- ============================================================
-- Phase 4: Appointment Scheduling Engine
-- ============================================================

-- Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_type TEXT NOT NULL, -- CHECKUP, FOLLOW_UP, SURGERY, EMERGENCY
    room TEXT, -- Required for SURGERY
    status TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, CANCELLED, COMPLETED, RESCHEDULED
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: doctor_availability
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_day INTEGER NOT NULL CHECK (available_day >= 0 AND available_day <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Policies for appointments (Using DO block to avoid error if policy exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage appointments.') THEN
        CREATE POLICY "Authenticated users can manage appointments."
            ON appointments FOR ALL
            USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Policies for doctor_availability
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage doctor availability.') THEN
        CREATE POLICY "Authenticated users can manage doctor availability."
            ON doctor_availability FOR ALL
            USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_availability_updated_at ON doctor_availability;
CREATE TRIGGER update_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed data for doctor availability (Example for existing doctors)
-- We need to fetch real doctor IDs from the users table in practice, 
-- but for the SQL file we can add some templates if needed or let the app handle it.
-- Let's add some generic availability rules.
