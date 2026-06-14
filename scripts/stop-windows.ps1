$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping Prelegal..."
docker stop prelegal
docker rm prelegal
Write-Host "Prelegal stopped."
