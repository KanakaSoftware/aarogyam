import fs from 'fs';

async function main() {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

    const supabaseUrl = urlMatch[1].trim();
    const supabaseKey = keyMatch[1].trim();

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    };

    let res = await fetch(`${supabaseUrl}/rest/v1/users?select=id,first_name,last_name,role`, { headers });
    let users = await res.json();
    console.log("== USERS ==");
    console.log(users.filter(u => u.role === 'doctor'));

    res = await fetch(`${supabaseUrl}/rest/v1/doctor_availability`, { headers });
    let avails = await res.json();
    console.log("== AVAILABILITIES ==");
    console.log(avails);
}
main();
