# OptiLeave - Quick Start Guide

Get OptiLeave running in 5 minutes!

## Prerequisites

✅ Node.js 18+ installed  
✅ Docker Desktop installed and running  

## Setup Steps

### 1. Install Dependencies (30 seconds)

```bash
npm install
```

### 2. Configure Environment (10 seconds)

The `.env` file is already configured with defaults. Just update the JWT secret:

```bash
# Open .env and change this line:
JWT_SECRET=change_this_to_a_secure_random_string_minimum_32_characters_long
```

### 3. Start Docker Services (20 seconds)

```bash
docker compose up -d postgres redis
```

Wait 10 seconds for services to start.

### 4. Setup Database (60 seconds)

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
cd ..
```

### 5. Start the App (10 seconds)

**Windows:**
```powershell
.\start-dev.ps1
```

**Mac/Linux:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2 (new terminal)
cd frontend && npm run dev
```

## Access the App

🌐 **Frontend:** http://localhost:3000  
🔌 **Backend:** http://localhost:4000  
💚 **Health Check:** http://localhost:4000/health  

## Login

Use any of these test accounts:

| Role | Email | Password |
|------|-------|----------|
| 👤 Employee | john.doe@example.com | password123 |
| 👔 Manager | manager.eng@example.com | password123 |
| 🔑 Admin | admin@example.com | password123 |

## What's Next?

1. **Submit a leave request** - Test the employee workflow
2. **Approve/reject requests** - Login as manager
3. **View analytics** - Check the dashboard
4. **Explore the calendar** - See team availability

## Troubleshooting

### Docker not running?
Start Docker Desktop and wait for it to fully load.

### Port 4000 already in use?
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

### Database connection error?
```bash
docker compose down
docker compose up -d postgres redis
# Wait 10 seconds
cd backend && npm run prisma:migrate
```

## Need Help?

- 📖 Full documentation: [README.md](./README.md)
- 🔧 Detailed setup: [SETUP.md](./SETUP.md)
- 🐛 Issues: Open a GitHub issue

---

**Enjoy using OptiLeave! 🚀**
