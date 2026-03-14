-- ==============================================================================
-- FIX: Insert missing Mon-Fri (Day 1 to 5) Availability for All Doctors
-- ==============================================================================

DO $$ 
DECLARE
    doc RECORD;
    d INT;
BEGIN
    FOR doc IN SELECT id FROM users WHERE role = 'doctor' LOOP
        FOR d IN 1..5 LOOP
            IF NOT EXISTS (
                SELECT 1 FROM doctor_availability 
                WHERE doctor_id = doc.id AND available_day = d
            ) THEN
                INSERT INTO doctor_availability (doctor_id, available_day, start_time, end_time, room)
                VALUES (doc.id, d, '09:00:00', '17:00:00', 'General Clinic');
            END IF;
        END LOOP;
    END LOOP;
END $$;
