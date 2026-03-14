$envPath = ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Output "No .env.local found"
    exit
}
$envContent = Get-Content $envPath
$url = ""
$key = ""
foreach ($line in $envContent) {
    if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.*)") { $url = $matches[1].Trim() }
    if ($line -match "SUPABASE_SERVICE_ROLE_KEY=(.*)") { $key = $matches[1].Trim() }
}

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 1. Get Doctor
$docsUrl = "$url/rest/v1/users?role=eq.doctor&select=id&limit=1"
$doctorResponse = Invoke-RestMethod -Uri $docsUrl -Headers $headers -Method Get
if (-not $doctorResponse) {
    Write-Output "No doctor found"
    exit
}
$doctorId = $doctorResponse[0].id

# 2. Get Patient
$patsUrl = "$url/rest/v1/patients?select=id&limit=1"
$patResponse = Invoke-RestMethod -Uri $patsUrl -Headers $headers -Method Get
$patientId = ""
if (-not $patResponse) {
    Write-Output "No patient found, creating dummy"
    # Just grab any user ID just in case
    exit
} else {
    $patientId = $patResponse[0].id
}


# 3. Get Avail
$availUrl = "$url/rest/v1/doctor_availability?doctor_id=eq.$doctorId&limit=1"
$availResponse = Invoke-RestMethod -Uri $availUrl -Headers $headers -Method Get
$targetDay = 1
$startTimeStr = "09:00:00"

if ($availResponse) {
    $targetDay = $availResponse[0].available_day
    $startTimeStr = $availResponse[0].start_time
}

# Add days logic from current date
$d = Get-Date
while ([int]$d.DayOfWeek -ne $targetDay) {
    $d = $d.AddDays(1)
}

$parts = $startTimeStr -split ":"
$d = Get-Date -Year $d.Year -Month $d.Month -Day $d.Day -Hour ([int]$parts[0]) -Minute ([int]$parts[1]) -Second 0

# Convert to ISO 8601 UTC string
$isoDate = $d.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Write-Output "Calculated DateTime: $isoDate"

$body = @{
    "patient_id" = $patientId
    "doctor_id" = $doctorId
    "appointment_time" = $isoDate
    "appointment_type" = "CHECKUP"
    "status" = "SCHEDULED"
} | ConvertTo-Json

$apptUrl = "$url/rest/v1/appointments"
$createResponse = Invoke-RestMethod -Uri $apptUrl -Headers $headers -Method Post -Body $body

Write-Output "Successfully created appointment!"
$createResponse | ConvertTo-Json | Write-Output
