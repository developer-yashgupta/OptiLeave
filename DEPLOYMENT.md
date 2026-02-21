# OptiLeave - Deployment Guide

This guide covers deploying OptiLeave to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for production)
- SSL certificate (recommended for production)

## Quick Deploy with Docker Compose

### 1. Clone and Configure

```bash
git clone <repository-url>
cd OptiLeave
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_NAME=optileave
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}

# Redis
REDIS_URL=redis://redis:6379

# JWT Configuration (IMPORTANT: Use a strong secret)
JWT_SECRET=your_very_secure_random_string_minimum_32_characters_long
JWT_EXPIRATION=8h

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NODE_ENV=production
```

### 3. Deploy All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API (port 4000)
- Frontend app (port 3000)

### 4. Verify Deployment

Check all services are running:
```bash
docker-compose ps
```

Test the backend health:
```bash
curl http://localhost:4000/health
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Production Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

Best for: DigitalOcean, AWS EC2, Linode, etc.

1. Set up a VPS with Docker installed
2. Clone the repository
3. Configure environment variables
4. Run `docker-compose up -d`
5. Set up Nginx as reverse proxy (optional)
6. Configure SSL with Let's Encrypt

### Option 2: Separate Services

Deploy backend and frontend to different platforms:

#### Backend (Railway, Render, Fly.io)
- Deploy from `backend/` directory
- Set environment variables in platform dashboard
- Ensure PostgreSQL and Redis are provisioned

#### Frontend (Vercel, Netlify)
- Deploy from `frontend/` directory
- Set `NEXT_PUBLIC_API_URL` to your backend URL
- Set `NEXT_PUBLIC_WS_URL` to your WebSocket URL

### Option 3: Kubernetes

For large-scale deployments, use the provided Kubernetes manifests (coming soon).

## Environment Variables Reference

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379
JWT_SECRET=minimum_32_characters_secure_random_string
JWT_EXPIRATION=8h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=app_password
PORT=4000
NODE_ENV=production
```

### Frontend (.env)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## SSL/HTTPS Setup

### Using Nginx Reverse Proxy

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Install SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Database Backup

### Manual Backup
```bash
docker exec optileave-postgres pg_dump -U postgres optileave > backup.sql
```

### Automated Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec optileave-postgres pg_dump -U postgres optileave > backup_$DATE.sql
```

### Restore from Backup
```bash
docker exec -i optileave-postgres psql -U postgres optileave < backup.sql
```

## Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks
```bash
# Backend health
curl http://localhost:4000/health

# Database connection
docker exec optileave-postgres pg_isready -U postgres

# Redis connection
docker exec optileave-redis redis-cli ping
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use load balancer (Nginx, HAProxy)
```

### Vertical Scaling
Update `docker-compose.yml` to add resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Troubleshooting

### Services won't start
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is accessible from frontend

## Security Checklist

- [ ] Change default JWT_SECRET to a strong random string
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL in production
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitor logs for suspicious activity

## Maintenance

### Update Application
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Database Migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Clear Redis Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Check service health endpoints
4. Review this guide
5. Open a GitHub issue

## Default Credentials

After deployment, login with:
- Admin: admin@example.com / password123
- Manager: manager.eng@example.com / password123
- Employee: john.doe@example.com / password123

**IMPORTANT: Change these passwords immediately in production!**
