-- Create the roles table to define the different RBAC groups
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description TEXT
);

-- Extension of the auth.users table (optional, but good for custom metadata)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES roles(name),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Audit logs table for tracking actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL, -- e.g., 'Patient', 'Appointment'
    entity_id VARCHAR(100), -- ID of the entity that was affected
    details JSONB, -- Optional additional details about the action
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Insert predefined roles (Idempotent)
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator with full access'),
('receptionist', 'Handles front-desk operations and appointment scheduling'),
('nurse', 'Provides patient care and assists with procedures'),
('doctor', 'Provides medical consultations and prescribes treatments'),
('specialist', 'Provides specialized medical consultations'),
('lab_technician', 'Conducts medical tests and processes lab results'),
('billing_officer', 'Manages patient billing and financial records'),
('compliance_officer', 'Ensures practice adheres to healthcare regulations'),
('patient', 'The patient receiving care')
ON CONFLICT (name) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- NON-RECURSIVE RLS POLICIES
-- We avoid calling any functions that query the 'users' table within the policy itself.
-- Instead, we use auth.uid() and assume that if a user is authenticated, they can see profiles
-- (which is common in a clinic setting where staff need to see each other).
-- For stricter security, we'd use JWT claims for roles.

DO $$
BEGIN
    -- Users Table Policies
    DROP POLICY IF EXISTS "Users can view their own profile." ON users;
    DROP POLICY IF EXISTS "Enable read access for own profile or admins" ON users;
    CREATE POLICY "Allow authenticated to read profiles"
        ON users FOR SELECT
        TO authenticated
        USING (true);

    -- Audit Logs Policies
    DROP POLICY IF EXISTS "Anyone can insert audit logs." ON audit_logs;
    CREATE POLICY "Anyone can insert audit logs."
        ON audit_logs FOR INSERT
        TO authenticated
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Admins can view audit logs." ON audit_logs;
    CREATE POLICY "Authenticated can view audit logs"
        ON audit_logs FOR SELECT
        TO authenticated
        USING (true); -- Simplified for POC stability
END
$$;

-- Trigger Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'patient')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers (Idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
