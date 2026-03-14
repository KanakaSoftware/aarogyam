import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAppt() {
    // 1. Get a doctor
    const { data: doctors, error: dErr } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .limit(1);

    if (dErr) {
        console.error("Error fetching doctor:", dErr);
        process.exit(1);
    }

    if (!doctors || doctors.length === 0) {
        console.log("No doctors found.");
        process.exit(1);
    }

    const doctor = doctors[0];
    console.log("Selected doctor:", doctor);

    // 2. Get the doctor's availability
    const { data: availability, error: aErr } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctor.id)
        .limit(1);

    if (aErr) {
        console.error("Error fetching availability:", aErr);
        process.exit(1);
    }

    if (!availability || availability.length === 0) {
        console.log("This doctor has no availability records.");
        // We'll create a dummy availability just to continue
        const { data: newAvail, error: newAvailErr } = await supabase
            .from('doctor_availability')
            .insert({
                doctor_id: doctor.id,
                available_day: new Date().getDay(),
                start_time: '09:00:00',
                end_time: '17:00:00',
                room: 'Room 101'
            })
            .select()
            .single();
        if (newAvailErr) {
            console.error("Failed to create dummy availability", newAvailErr);
            process.exit(1);
        }
        availability.push(newAvail);
        console.log("Created random availability rule.");
    }

    const avail = availability[0];
    console.log("Selected availability rule:", avail);

    // 3. Get a patient
    const { data: patients, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

    if (pErr) {
        console.error("Error fetching patient", pErr);
        process.exit(1);
    }
    
    if (!patients || patients.length === 0) {
        console.log("No patients found. Creating one...");
        const {data: newPat, error: newPatErr} = await supabase.from('patients').insert({
            name: "Test Patient",
            email: "test.patient@example.com",
            phone: "+1234567890",
            date_of_birth: "1990-01-01",
            gender: "OTHER"
        }).select().single();
        
        if (newPatErr) {
             console.error("Failed to create dummy patient", newPatErr);
             process.exit(1);
        }
        patients.push(newPat);
    }

    const patient = patients[0];
    console.log("Selected patient:", patient);

    // 4. Calculate next available time based on availability rule
    // avail.available_day is 0-6 (0=Sunday)
    // avail.start_time is e.g., '09:00:00'
    const today = new Date();
    // Let's just find the next date that matches `available_day`
    const targetDay = avail.available_day;
    let appointmentDate = new Date();
    // Fix: Add days until we hit the target day
    let count = 0;
    while (appointmentDate.getDay() !== targetDay && count < 7) {
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        count++;
    }
    
    // Parse start_time to add to appointmentDate
    const [hours, minutes] = avail.start_time.split(':');
    appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const apptTimeIso = appointmentDate.toISOString();

    console.log("Calculated appointment time (local):", appointmentDate);
    console.log("Calculated appointment time (ISO):", apptTimeIso);

    // 5. Insert Appointment
    // Wait, ensure there's no double booking
    const {data: exist} = await supabase.from('appointments').select('*').eq('doctor_id', doctor.id).eq('appointment_time', apptTimeIso);
    if (exist && exist.length > 0) {
         console.log("Appointment already exists at this time, skipping creation.");
         console.log(exist[0]);
         process.exit(0);
    }

    const { data: appointment, error: apptErr } = await supabase
        .from('appointments')
        .insert({
            patient_id: patient.id,
            doctor_id: doctor.id,
            appointment_time: apptTimeIso,
            appointment_type: 'CHECKUP',
            status: 'SCHEDULED'
        })
        .select()
        .single();
    
    if (apptErr) {
        console.error("Failed to insert appointment:", apptErr);
        process.exit(1);
    }

    console.log("✅ Successfully created appointment:", appointment);
    process.exit(0);
}

createAppt();
