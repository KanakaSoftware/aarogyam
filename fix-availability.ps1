$envFile = Get-Content ".env.local"
$supabaseUrl = ""
$supabaseKey = ""

foreach ($line in $envFile) {
    if ($line -match "^NEXT_PUBLIC_SUPABASE_URL=(.*)$") {
        $supabaseUrl = $matches[1].Trim()
    }
    if ($line -match "^SUPABASE_SERVICE_ROLE_KEY=(.*)$") {
        $supabaseKey = $matches[1].Trim()
    }
}

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 1. Get Doctors
$usersResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/users?select=id,role&role=eq.doctor" -Method Get -Headers $headers
$doctors = $usersResponse

if ($doctors.Count -eq 0) {
    Write-Host "No doctors found."
    exit
}

Write-Host "Found $($doctors.Count) doctors. Adding standard 9-5 availability for Mon-Fri."

# 2. Add Availability for 1..5
foreach ($doc in $doctors) {
    Write-Host "Processing Doctor ID: $($doc.id)"
    
    for ($day = 1; $day -le 5; $day++) {
        # Check if exists
        $checkUri = "$supabaseUrl/rest/v1/doctor_availability?doctor_id=eq.$($doc.id)&available_day=eq.$day"
        $existing = Invoke-RestMethod -Uri $checkUri -Method Get -Headers $headers
        
        if ($existing.Count -gt 0) {
            Write-Host "Day $day already has availability. Skipping."
            continue
        }
        
        # Insert new
        $body = @{
            doctor_id = $doc.id
            available_day = $day
            start_time = "09:00:00"
            end_time = "17:00:00"
            room = "General Clinic"
        } | ConvertTo-Json
        
        try {
            $insertResult = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/doctor_availability" -Method Post -Headers $headers -Body $body
            Write-Host "✅ Inserted Mon-Fri availability for Day $day"
        } catch {
            Write-Host "❌ Failed to insert for Day $day: $_"
        }
    }
}

Write-Host "Done!"
