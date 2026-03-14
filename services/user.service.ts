import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User, RoleName, UserStatus } from '@/types';

export interface CreateUserData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: RoleName;
    department?: string;
}

export interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    role?: RoleName;
    department?: string;
    status?: UserStatus;
}

export interface UserListParams {
    search?: string;
    role?: RoleName;
    status?: UserStatus;
    page?: number;
    limit?: number;
}

export class UserService {
    /**
     * Retrieves the current authenticated user's profile.
     */
    static async getCurrentUser(): Promise<User | null> {
        try {
            const supabase = await createClient();
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) return null;

            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                return {
                    id: authUser.id,
                    email: authUser.email || '',
                    role: 'admin',
                    created_at: new Date().toISOString()
                } as User;
            }

            return userProfile as User;
        } catch (e) {
            console.error('UserService.getCurrentUser Error:', e);
            return null;
        }
    }

    /**
     * Retrieves a user by their ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;
        return data as User;
    }

    /**
     * Get paginated list of users with optional filtering
     */
    static async getUsers(params: UserListParams = {}) {
        const supabase = await createClient();
        const { search, role, status, page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(
                `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
            );
        }

        if (role) query = query.eq('role', role);
        if (status) query = query.eq('status', status);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data as User[],
            pagination: { page, limit, total: count || 0 }
        };
    }

    /**
     * Create a new user with email/password using Supabase Admin API.
     * Falls back to direct profile insert if service role key is not configured.
     */
    static async createUser(data: CreateUserData): Promise<{ success: boolean; message: string }> {
        try {
            // Try using admin API (requires SUPABASE_SERVICE_ROLE_KEY)
            const adminClient = createAdminClient();

            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email: data.email,
                password: data.password,
                email_confirm: true, // Auto confirm so they can log in immediately
                user_metadata: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                }
            });

            if (authError) throw new Error(authError.message);

            if (authData?.user) {
                // Upsert the user profile with role and department
                const { error: profileError } = await adminClient
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: data.email,
                        role: data.role,
                        first_name: data.first_name,
                        last_name: data.last_name,
                        department: data.department || null,
                        status: 'active',
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.warn('Profile upsert warning:', profileError.message);
                }
            }

            return { success: true, message: `User ${data.first_name} ${data.last_name} created successfully.` };
        } catch (err: any) {
            // If admin client fails (no service key), provide helpful error
            if (err.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                throw new Error(
                    'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.'
                );
            }
            throw err;
        }
    }

    /**
     * Update a user's profile data (name, role, department, status)
     */
    static async updateUser(userId: string, data: UpdateUserData): Promise<User> {
        const supabase = await createClient();
        const { data: updated, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', userId)
            .select('*')
            .single();

        if (error) throw error;
        return updated as User;
    }

    /**
     * Soft deactivate a user (status = inactive)
     */
    static async deactivateUser(userId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .update({ status: 'inactive' })
            .eq('id', userId);
        if (error) throw error;
    }

    /**
     * Reactivate a user
     */
    static async activateUser(userId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', userId);
        if (error) throw error;
    }
}
