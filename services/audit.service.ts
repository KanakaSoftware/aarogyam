import { createClient } from '@/lib/supabase/server';
import { AuditLog } from '@/types';

export class AuditService {
    /**
     * Logs an action to the audit_logs table.
     */
    static async logAction(
        action: string,
        entity: string,
        entityId?: string | null,
        details?: Record<string, unknown> | null
    ): Promise<void> {
        try {
            const supabase = await createClient();

            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('audit_logs').insert({
                user_id: user?.id || null,
                action,
                entity,
                entity_id: entityId || null,
                details: details || null
            });

            if (error) {
                console.warn('Warning: Failed to insert audit log (table might not exist):', error.message);
            }
        } catch (e: unknown) {
            console.warn('AuditService Error:', e instanceof Error ? e.message : String(e));
        }
    }

    /**
     * Retrieves audit logs (Admin only by RLS)
     */
    static async getLogs(limit: number = 50): Promise<AuditLog[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('Warning fetching audit logs (table might not exist):', error.message);
            return [];
        }

        return data as AuditLog[];
    }
    /**
     * Retrieves audit logs for a specific entity
     */
    static async getLogsByEntity(entity: string, entityId: string, limit: number = 50): Promise<AuditLog[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity', entity)
            .eq('entity_id', entityId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn(`Warning fetching audit logs for ${entity} ${entityId}:`, error.message);
            return [];
        }

        return data as AuditLog[];
    }
}
