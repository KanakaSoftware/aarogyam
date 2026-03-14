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

    // 1. Get Doctor
    let res = await fetch(`${supabaseUrl}/rest/v1/users?role=eq.doctor&select=id&limit=1`, { headers });
    let docs = await res.json();
    if (!docs || docs.length === 0) {
        console.log("No doctors found");
        process.exit(1);
    }
    const doctorId = docs[0].id;
    console.log("Doctor:", doctorId);

    // 2. Get Patient
    res = await fetch(`${supabaseUrl}/rest/v1/patients?select=id&limit=1`, { headers });
    let pats = await res.json();
    let patientId;
    if (!pats || pats.length === 0) {
        console.log("No patients found, making dummy");
        const nRes = await fetch(`${supabaseUrl}/rest/v1/patients`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                name: "Auto Tester",
                email: "auto@test.com",
                phone: "+111",
                gender: "MALE",
                date_of_birth: "1980-01-01"
            })
        });
        const nPats = await nRes.json();
        patientId = nPats[0].id;
    } else {
        patientId = pats[0].id;
    }
    console.log("Patient:", patientId);

    // 3. Get Availability
    res = await fetch(`${supabaseUrl}/rest/v1/doctor_availability?doctor_id=eq.${doctorId}&limit=1`, { headers });
    let avails = await res.json();
    
    let targetDay = 1; // Monday
    let startTime = "09:00:00";
    if (!avails || avails.length === 0) {
        console.log("No avail found. creating dummy.");
        const arr = [{ doctor_id: doctorId, available_day: 1, start_time: "09:00:00", end_time: "17:00:00", room: "101" }];
        await fetch(`${supabaseUrl}/rest/v1/doctor_availability`, {
            method: 'POST', headers, body: JSON.stringify(arr)
        });
    } else {
        targetDay = avails[0].available_day;
        startTime = avails[0].start_time;
    }

    // Calc next available day
    let d = new Date();
    d.setUTCHours(0,0,0,0);
    while (d.getDay() !== targetDay) {
        d.setDate(d.getDate() + 1);
    }
    let [hh, mm] = startTime.split(":");
    d.setHours(parseInt(hh), parseInt(mm));

    const iso = d.toISOString();
    console.log("Time (ISO):", iso);

    // 4. Create Appt
    const apptData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_time: iso,
        appointment_type: 'CHECKUP',
        status: 'SCHEDULED'
    };

    const finalRes = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(apptData)
    });

    const created = await finalRes.json();
    console.log("CREATED:", JSON.stringify(created, null, 2));

}

main().catch(e => console.error("Error:", e));
