#!/bin/bash

# OptiLeave Deployment Script
echo "=== OptiLeave Deployment ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "✓ Environment file found"
echo "✓ Docker is running"
echo ""

# Pull latest changes (optional)
read -p "Pull latest changes from git? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin main
fi

# Build and start services
echo ""
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Test backend health
echo ""
echo "Testing backend health..."
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo ""
echo "Default credentials:"
echo "  Admin: admin@example.com / password123"
echo "  Manager: manager.eng@example.com / password123"
echo "  Employee: john.doe@example.com / password123"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Stop services: docker-compose -f docker-compose.prod.yml down"
