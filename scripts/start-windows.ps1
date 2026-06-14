$ErrorActionPreference = "Stop"

Push-Location "$PSScriptRoot\.."

Write-Host "Building Prelegal..."
docker build -t prelegal .

Write-Host "Starting Prelegal..."
$EnvFlag = if (Test-Path .env) { "--env-file .env" } else { "" }
docker run -d --name prelegal -p 8000:8000 $EnvFlag prelegal

Write-Host "Prelegal is running at http://localhost:8000"

Pop-Location
