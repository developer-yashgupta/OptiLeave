# Setup Guide

This guide will help you set up OptiLeave for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: [Download](https://nodejs.org/)
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download](https://git-scm.com/)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd OptiLeave
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```bash
# Database (default values work for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optileave
DB_NAME=optileave
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (default works for local development)
REDIS_URL=redis://localhost:6379

# JWT Secret (IMPORTANT: Change this to a secure random string)
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_for_security

# Email Configuration (required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# API URLs (default works for local development)
API_URL=http://localhost:4000
WS_URL=ws://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

**Note on Email Configuration:**
- For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833)
- For other providers, use their SMTP settings

### 3. Install Dependencies

Install all dependencies for the monorepo:

```bash
npm install
```

This will install dependencies for both backend and frontend.

### 4. Start Docker Services

Start PostgreSQL and Redis using Docker Compose:

```bash
npm run docker:up
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Verify services are running:

```bash
docker ps
```

You should see containers for `optileave-postgres` and `optileave-redis`.

### 5. Set Up the Database

Navigate to the backend directory and run migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Seed the database with initial data:

```bash
npm run prisma:seed
```

This will create:
- 2 teams (Engineering, Product)
- 6 users (1 admin, 2 managers, 3 employees)
- Default leave balances
- Public holidays
- Default approval rules

### 6. Start the Development Servers

From the root directory, start both backend and frontend:

```bash
cd ..
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 7. Verify the Setup

**Backend Health Check:**
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**Frontend:**
Open your browser and navigate to `http://localhost:3000`

### 8. Test Credentials

Use these credentials to test the application:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Engineering Manager | manager.eng@example.com | password123 |
| Product Manager | manager.product@example.com | password123 |
| Employee | john.doe@example.com | password123 |
| Employee | jane.smith@example.com | password123 |
| Employee | bob.johnson@example.com | password123 |

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Common Issues and Solutions

### Issue: Port Already in Use

If you see an error like "Port 4000 is already in use":

```bash
# Find the process using the port
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Issue: Docker Services Not Starting

```bash
# Stop all containers
npm run docker:down

# Remove volumes and restart
docker-compose down -v
npm run docker:up
```

### Issue: Database Connection Error

1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check the DATABASE_URL in `.env` matches the Docker service

3. Restart the database:
   ```bash
   docker-compose restart postgres
   ```

### Issue: Prisma Client Not Generated

```bash
cd backend
npm run prisma:generate
```

### Issue: Migration Errors

Reset the database (WARNING: This will delete all data):

```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

## Development Workflow

### Making Database Schema Changes

1. Edit `backend/prisma/schema.prisma`
2. Create a migration:
   ```bash
   cd backend
   npx prisma migrate dev --name description_of_change
   ```
3. The Prisma Client will be automatically regenerated

### Viewing the Database

Use Prisma Studio to view and edit data:

```bash
cd backend
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555`

### Stopping Services

Stop the development servers with `Ctrl+C`

Stop Docker services:
```bash
npm run docker:down
```

## Next Steps

- Review the [README.md](./README.md) for project overview
- Check the [API Documentation](./docs/API.md) (coming soon)
- Read the [Design Document](./.kiro/specs/intelligent-leave-management-system/design.md)

## Getting Help

If you encounter issues not covered here:

1. Check the logs:
   ```bash
   npm run docker:logs
   ```

2. Verify all environment variables are set correctly

3. Ensure all prerequisites are installed and up to date

4. Try a clean restart:
   ```bash
   npm run docker:down
   docker-compose down -v
   npm run docker:up
   cd backend && npm run prisma:migrate && npm run prisma:seed
   ```
