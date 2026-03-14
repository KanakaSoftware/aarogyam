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
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    // 1. Get all doctors
    let res = await fetch(`${supabaseUrl}/rest/v1/users?select=id,role&role=eq.doctor`, { headers });
    let doctors = await res.json();
    console.log(`Found ${doctors.length} doctors.`);

    if (doctors.length === 0) {
        console.log("No doctors found to add availability to.");
        return;
    }

    // 2. For each doctor, insert availability for Mon-Fri (1-5) if it doesn't exist
    for (const doc of doctors) {
        console.log(`Setting availability for doctor: ${doc.id}`);
        for (let day = 1; day <= 5; day++) {
             // Check if it exists
             let checkRes = await fetch(`${supabaseUrl}/rest/v1/doctor_availability?doctor_id=eq.${doc.id}&available_day=eq.${day}`, { headers });
             let existing = await checkRes.json();
             
             if (existing && existing.length > 0) {
                 console.log(`Day ${day} already has availability, skipping.`);
                 continue;
             }

             // Insert
             const payload = {
                 doctor_id: doc.id,
                 available_day: day,
                 start_time: '09:00:00',
                 end_time: '17:00:00',
                 room: 'General Clinic'
             };

             let insertRes = await fetch(`${supabaseUrl}/rest/v1/doctor_availability`, {
                 method: 'POST',
                 headers: headers,
                 body: JSON.stringify(payload)
             });

             if (insertRes.ok) {
                 console.log(`✅ Inserted Day ${day} (9 AM - 5 PM)`);
             } else {
                 console.error(`❌ Failed to insert Day ${day}`, await insertRes.text());
             }
        }
    }
    console.log("Finished updating doctor availabilities.");
}

main();
