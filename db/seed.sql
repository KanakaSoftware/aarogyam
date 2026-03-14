-- Example seed data for the application

-- This typically requires inserting users into auth.users first if you are using Supabase Auth.
-- However, for the application logic `public.users` table, here is example inserted data
-- assuming the corresponding `auth.users` already exist or we disabled the FK for seeding.

-- Insert Users (assuming IDs match some auth.users records for local testing)
-- NOTE: In a real Supabase instance, you must create these users via Supabase Auth API
-- or insert into auth.users first.
-- INSERT INTO auth.users (id, email) VALUES
-- ('d0000000-0000-0000-0000-000000000001', 'admin@example.com'),
-- ('d0000000-0000-0000-0000-000000000002', 'doctor@example.com'),
-- ('d0000000-0000-0000-0000-000000000003', 'nurse@example.com');

-- INSERT INTO public.users (id, email, role, first_name, last_name) VALUES
-- ('d0000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 'System', 'Admin'),
-- ('d0000000-0000-0000-0000-000000000002', 'doctor@example.com', 'doctor', 'John', 'Doe'),
-- ('d0000000-0000-0000-0000-000000000003', 'nurse@example.com', 'nurse', 'Jane', 'Smith');

-- Example Audit Logs
-- INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES
-- ('d0000000-0000-0000-0000-000000000001', 'User Login', 'Auth', null, '{"ip": "127.0.0.1"}'),
-- ('d0000000-0000-0000-0000-000000000002', 'Viewed Dashboard', 'Dashboard', null, null);
