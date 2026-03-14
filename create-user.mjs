import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    console.log('Attempting to create user admin@example.com...');
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'Test@123',
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    console.log('User signed up successfully. User ID:', data?.user?.id);

    // Wait a second to allow the PostgreSQL trigger to create the public.users record
    await new Promise(r => setTimeout(r, 1000));

    // Note: Depending on Supabase RLS policies and email confirmations, 
    // updating the role with the anon key might fail. If it does, we'll see it below.
    if (data?.user?.id) {
        console.log('Attempting to assign admin role...');
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', data.user.id);

        if (updateError) {
            console.warn('Warning: Could not update role to admin (this is usually due to Row Level Security requiring a service_role key):', updateError.message);
            console.warn('You may need to manually update the role in the Supabase Dashboard SQL editor:');
            console.warn(`UPDATE public.users SET role = 'admin' WHERE id = '${data.user.id}';`);
        } else {
            console.log('Successfully assigned admin role!');
        }
    }
}

createUser();
