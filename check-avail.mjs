import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvail() {
    const { data: doctors } = await supabase.from('users').select('id, first_name, last_name, role').eq('role', 'doctor');
    console.log("DOCTORS:");
    console.log(doctors);

    const { data: avails } = await supabase.from('doctor_availability').select('*');
    console.log("AVAILABILITIES:");
    console.log(avails);
}

checkAvail();
