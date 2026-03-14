import { createClient } from '@/lib/supabase/server';
import { LabOrder, LabOrderStatus, LabResult } from '@/types';

export class LabService {
    /**
     * Fetch paginated lab orders with optional filtering and search
     */
    static async getLabOrders(params: {
        page: number;
        limit: number;
        status?: string;
        patient_id?: string;
        doctor_id?: string;
        search?: string;
    }) {
        const supabase = await createClient();
        const { page = 1, limit = 10, status, search, patient_id, doctor_id } = params;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('lab_orders')
            .select(`
                *,
                patients(id, name, email, phone),
                doctors:users!lab_orders_doctor_id_fkey(id, first_name, last_name, role)
            `, { count: 'exact' });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (patient_id) {
            query = query.eq('patient_id', patient_id);
        }
        if (doctor_id) {
            query = query.eq('doctor_id', doctor_id);
        }
        
        // Handling search
        if (search) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
            if (isUuid) {
                query = query.or(`test_name.ilike.%${search}%,patients.name.ilike.%${search}%,id.eq.${search}`);
            } else {
                query = query.or(`test_name.ilike.%${search}%,patients.name.ilike.%${search}%`);
            }
        }

        query = query.order('ordered_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching lab orders:', error);
            throw error;
        }

        return {
            data: data as any[],
            pagination: {
                page,
                limit,
                total: count ?? 0
            }
        };
    }

    /**
     * Get a single lab order by ID
     */
    static async getLabOrderById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('lab_orders')
            .select(`
                *,
                patients(*),
                doctors:users!lab_orders_doctor_id_fkey(*),
                lab_results(
                    *,
                    uploader:users(*)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create a new lab order
     */
    static async createLabOrder(data: {
        patient_id: string;
        doctor_id: string;
        test_name: string;
        notes?: string;
    }) {
        const supabase = await createClient();
        const { data: order, error } = await supabase
            .from('lab_orders')
            .insert({
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                test_name: data.test_name,
                notes: data.notes || null,
                status: 'ORDERED'
            })
            .select()
            .single();

        if (error) throw error;
        return order;
    }

    /**
     * Update an existing lab order
     */
    static async updateLabOrder(id: string, data: { test_name?: string; notes?: string }) {
        const supabase = await createClient();
        const { data: updated, error } = await supabase
            .from('lab_orders')
            .update({
                ...(data.test_name && { test_name: data.test_name }),
                ...(data.notes !== undefined && { notes: data.notes })
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updated;
    }

    /**
     * Delete a lab order
     */
    static async deleteLabOrder(id: string) {
        const supabase = await createClient();
        const { error } = await supabase
            .from('lab_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    /**
     * Update lab order status
     */
    static async updateLabOrderStatus(id: string, status: LabOrderStatus) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('lab_orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Upload a lab result and update order status to RESULT_UPLOADED
     */
    static async uploadLabResult(data: {
        lab_order_id: string;
        report_name: string;
        result_file_url: string;
        result_notes?: string;
        uploaded_by?: string;
    }): Promise<LabResult> {
        const supabase = await createClient();

        // 1. Insert result
        const { data: result, error: resultError } = await supabase
            .from("lab_results")
            .insert({
                lab_order_id: data.lab_order_id,
                report_name: data.report_name,
                result_file_url: data.result_file_url,
                result_notes: data.result_notes,
                uploaded_by: data.uploaded_by
            })
            .select()
            .single();

        if (resultError) throw resultError;

        // Auto-update order status
        const { error: updateError } = await supabase
            .from('lab_orders')
            .update({ status: 'RESULT_UPLOADED' })
            .eq('id', data.lab_order_id);

        if (updateError) throw updateError;

        return result;
    }
}
