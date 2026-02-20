# Development Start Script
Write-Host "=== Starting OptiLeave ===" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
Write-Host "Checking Docker services..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=optileave-postgres" --filter "status=running" -q
$redisRunning = docker ps --filter "name=optileave-redis" --filter "status=running" -q

if (-not $postgresRunning -or -not $redisRunning) {
    Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
    docker-compose up -d postgres redis
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "Services are running!" -ForegroundColor Green
Write-Host ""

# Start backend in new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "=== Development Servers Starting ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "  Employee: john.doe@example.com / password123"
Write-Host "  Manager: manager.eng@example.com / password123"
Write-Host "  Admin: admin@example.com / password123"
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray
