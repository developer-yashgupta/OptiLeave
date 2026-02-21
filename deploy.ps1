# OptiLeave Deployment Script for Windows
Write-Host "=== OptiLeave Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Environment file found" -ForegroundColor Green
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Pull latest changes (optional)
$pull = Read-Host "Pull latest changes from git? (y/n)"
if ($pull -eq "y" -or $pull -eq "Y") {
    git pull origin main
}

# Build and start services
Write-Host ""
Write-Host "Building and starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps

# Test backend health
Write-Host ""
Write-Host "Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@example.com / password123"
Write-Host "  Manager: manager.eng@example.com / password123"
Write-Host "  Employee: john.doe@example.com / password123"
Write-Host ""
Write-Host "View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
Write-Host "Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
