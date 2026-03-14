-- Granular security for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage appointments." ON appointments;

-- 2. Staff/Admin: Manage ALL appointments
CREATE POLICY "Staff can manage all appointments"
    ON appointments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'receptionist')
        )
    );

-- 3. Doctors: View/Update THEIR appointments
CREATE POLICY "Doctors can manage their assigned appointments"
    ON appointments FOR ALL
    TO authenticated
    USING (
        doctor_id = auth.uid()
    );

-- 4. Patients: View THEIR appointments
-- (Assume patient e-mail matches user e-mail for lookup)
CREATE POLICY "Patients can view their own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN users u ON p.email = u.email
            WHERE u.id = auth.uid()
            AND u.role = 'patient'
        )
    );
