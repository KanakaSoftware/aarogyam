-- ============================================================
-- Phase 7: Lab Workflow Module
-- ============================================================

-- Table: lab_orders
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ORDERED', -- ORDERED, SAMPLE_COLLECTED, PROCESSING, RESULT_UPLOADED, DOCTOR_REVIEWED, PATIENT_NOTIFIED
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table: lab_results
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    result_file_url TEXT NOT NULL,
    result_notes TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS for lab_orders
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Policies for lab_orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage lab_orders.') THEN
        CREATE POLICY "Authenticated users can manage lab_orders."
            ON lab_orders FOR ALL
            USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Policies for lab_results
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage lab_results.') THEN
        CREATE POLICY "Authenticated users can manage lab_results."
            ON lab_results FOR ALL
            USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Triggers to update updated_at
DROP TRIGGER IF EXISTS update_lab_orders_updated_at ON lab_orders;
CREATE TRIGGER update_lab_orders_updated_at
    BEFORE UPDATE ON lab_orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
