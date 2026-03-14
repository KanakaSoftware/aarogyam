import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key.
 * This bypasses Row Level Security and is used for admin operations.
 * REQUIRES: SUPABASE_SERVICE_ROLE_KEY in environment variables.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file. ' +
            'You can find it in your Supabase project settings under API > service_role.'
        );
    }

    return createSupabaseClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
}
