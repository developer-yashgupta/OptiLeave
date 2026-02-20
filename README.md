# OptiLeave

A full-stack leave management system with automated approval workflows, real-time updates, and intelligent workload analysis.

## Features

- 🔐 Secure JWT authentication
- 📝 Leave request submission and management
- ✅ Automated approval/escalation based on rules
- 📊 Real-time workload analysis
- 📅 Team calendar with leave visualization
- 👥 Role-based access control (Employee, Manager, Admin)
- 🎨 Modern cyber-themed UI with glassmorphism
- 🔄 Real-time updates with WebSocket
- 📱 Fully responsive design

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios (API client)
- Socket.io-client (real-time)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (caching)
- JWT authentication
- Socket.io (WebSocket)

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd OptiLeave
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Key variables to update:
- `JWT_SECRET` - Change to a secure random string (min 32 characters)
- `SMTP_*` - Add your email service credentials (optional for testing)

### 3. Start Docker Services

```bash
docker compose up -d postgres redis
```

Wait 10 seconds for services to initialize.

### 4. Setup Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
cd ..
```

### 5. Start the Application

**Option A: Use PowerShell script (Windows)**
```powershell
.\start-dev.ps1
```

**Option B: Manual start**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

### 7. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Manager | manager.eng@example.com | password123 |
| Employee | john.doe@example.com | password123 |

## Project Structure

```
OptiLeave/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── package.json
├── frontend/                # Frontend application
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json
├── .kiro/                   # Spec files
├── docker-compose.yml       # Docker services
├── .env                     # Environment variables
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Leave Management
- `GET /api/leave/balance` - Get leave balance
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/history` - Get leave history
- `GET /api/leave/pending` - Get pending requests (Manager)
- `PUT /api/leave/:id/approve` - Approve request (Manager)
- `PUT /api/leave/:id/reject` - Reject request (Manager)
- `DELETE /api/leave/:id` - Cancel request

## Development

### Backend

```bash
cd backend

# Start dev server
npm run dev

# Run tests
npm test

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

### Frontend

```bash
cd frontend

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Docker Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Remove volumes (WARNING: deletes data)
docker compose down -v
```

## Troubleshooting

### Docker not found
Install Docker Desktop from https://www.docker.com/products/docker-desktop/

### Port already in use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4000
kill -9 <PID>
```

### Database connection error
```bash
# Restart Docker services
docker compose down
docker compose up -d postgres redis

# Wait 10 seconds, then retry
cd backend
npm run prisma:migrate
npm run prisma:seed
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optileave
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secure_secret_key_minimum_32_characters
JWT_EXPIRATION=8h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
PORT=4000
NODE_ENV=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Testing

```bash
# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

## Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
