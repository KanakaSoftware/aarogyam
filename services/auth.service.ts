import { createClient } from '@/lib/supabase/client';
import { LoginInput } from '@/lib/validations/auth';

export class AuthService {
    /**
     * Logs a user in using email and password.
     * Note: This is client-side because it sets the browser session.
     */
    static async login(credentials: LoginInput) {
        const supabase = createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Attempt to log the login action via API or Server Action
        // But since this is a client service, we can't reliably call server actions here
        // unless we create an API route. However, we'll implement a server action that
        // this client code can call, or better: just let the server action handle login entirely.

        return { success: true, data };
    }

    /**
     * Logs the user out.
     */
    static async logout() {
        const supabase = createClient();

        // Log the logout action before clearing session. 
        // This requires a Server Action endpoint in Nextjs App Router architecture since RLS 
        // may prevent arbitrary inserts from the client unless allowed. 
        // For POC, we'll do the core logout here.

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }
}
