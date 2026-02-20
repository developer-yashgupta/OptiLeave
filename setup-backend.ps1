# Backend Setup Script for Windows
Write-Host "=== OptiLeave - Backend Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running!" -ForegroundColor Green
Write-Host ""

# Start PostgreSQL and Redis with Docker Compose
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be healthy
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Navigate to backend directory
Set-Location backend

# Install dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate

# Seed database
Write-Host "Seeding database with test data..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host ""
Write-Host "=== Backend Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  Admin: admin@example.com / password123"
Write-Host "  Manager: manager.eng@example.com / password123"
Write-Host "  Employee: john.doe@example.com / password123"
Write-Host ""
Write-Host "To start the backend server, run:" -ForegroundColor Yellow
Write-Host "  cd backend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "The API will be available at: http://localhost:4000" -ForegroundColor Cyan
