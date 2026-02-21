# Deploy OptiLeave to Free Platforms

This guide shows you how to deploy OptiLeave for FREE using:
- **Backend**: Render.com (Free tier with PostgreSQL + Redis)
- **Frontend**: Vercel (Free tier, perfect for Next.js)

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - Name: `optileave-db`
   - Database: `optileave`
   - User: `optileave_user`
   - Region: Choose closest to you
   - Plan: **Free**
3. Click "Create Database"
4. Wait 2-3 minutes for provisioning
5. Copy the "Internal Database URL" (starts with `postgresql://`)

### Step 3: Create Redis Instance
1. Click "New +" → "Redis"
2. Configure:
   - Name: `optileave-redis`
   - Region: Same as database
   - Plan: **Free** (30MB)
3. Click "Create Redis"
4. Copy the "Internal Redis URL" (starts with `redis://`)

### Step 4: Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `optileave-backend`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`
   - Plan: **Free**

4. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   DATABASE_URL = [paste Internal Database URL from Step 2]
   REDIS_URL = [paste Internal Redis URL from Step 3]
   JWT_SECRET = your_secure_random_string_minimum_32_characters_long
   JWT_EXPIRATION = 8h
   NODE_ENV = production
   PORT = 4000
   ```

   Optional (for email notifications):
   ```
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your_email@gmail.com
   SMTP_PASS = your_app_password
   ```

5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. Your backend URL will be: `https://optileave-backend.onrender.com`
8. Test it: `https://optileave-backend.onrender.com/health`

### Important Notes for Render Free Tier:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds
- 750 hours/month free (enough for one service)
- Database: 1GB storage, expires after 90 days (can create new one)

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Verify your email

### Step 2: Deploy Frontend
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://optileave-backend.onrender.com
   NEXT_PUBLIC_WS_URL = wss://optileave-backend.onrender.com
   ```

5. Click "Deploy"
6. Wait 2-3 minutes
7. Your frontend URL will be: `https://optileave-xxx.vercel.app`

### Step 3: Configure Custom Domain (Optional)
1. In Vercel project settings → "Domains"
2. Add your custom domain
3. Update DNS records as instructed

## Part 3: Update Backend CORS

After deployment, you need to update CORS settings in your backend to allow requests from Vercel.

### Option A: Update via Render Dashboard
1. Go to your backend service on Render
2. Environment → Add variable:
   ```
   FRONTEND_URL = https://optileave-xxx.vercel.app
   ```
3. Redeploy the service

### Option B: Update Code (Recommended)
Update `backend/src/index.ts` to include your Vercel URL in CORS origins, then push to GitHub (auto-deploys).

## Testing Your Deployment

1. Visit your Vercel URL: `https://optileave-xxx.vercel.app`
2. Try logging in with default credentials:
   - Email: `admin@example.com`
   - Password: `password123`
3. If login fails, check:
   - Backend health: `https://optileave-backend.onrender.com/health`
   - Browser console for errors
   - Render logs: Dashboard → Logs

## Troubleshooting

### Backend Issues

**"Service Unavailable" or slow first load**
- Normal for Render free tier after inactivity
- Wait 30-50 seconds for service to wake up
- Consider upgrading to paid tier ($7/month) for always-on

**Database connection errors**
- Check DATABASE_URL is correct (use Internal URL)
- Ensure database is in same region as backend
- Check Render logs for specific errors

**Migrations not running**
- Check build logs on Render
- Ensure `npx prisma migrate deploy` is in start command
- Manually run: Render Dashboard → Shell → `npx prisma migrate deploy`

### Frontend Issues

**"Failed to fetch" errors**
- Check NEXT_PUBLIC_API_URL is correct (include https://)
- Verify backend is running: visit `/health` endpoint
- Check browser console for CORS errors

**WebSocket connection failed**
- Ensure NEXT_PUBLIC_WS_URL uses `wss://` (not `ws://`)
- Check backend WebSocket support is enabled

**Environment variables not working**
- Redeploy after adding variables
- Variables must start with `NEXT_PUBLIC_` for client-side access

## Cost Breakdown (FREE!)

### Render Free Tier:
- ✅ 1 Web Service (Backend)
- ✅ 1 PostgreSQL Database (1GB, 90 days)
- ✅ 1 Redis Instance (30MB)
- ✅ 750 hours/month
- ⚠️ Spins down after 15 min inactivity

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Always-on (no spin down)

## Upgrade Options (If Needed)

### Render Paid Plans:
- **Starter ($7/month)**: Always-on, no spin down
- **Standard ($25/month)**: More resources, better performance

### Vercel Paid Plans:
- **Pro ($20/month)**: More bandwidth, team features
- Usually not needed for small projects

## Alternative Free Platforms

### Backend Alternatives:
1. **Railway** (Free $5 credit/month)
   - Easier setup
   - Better free tier
   - Credit expires monthly

2. **Fly.io** (Free tier)
   - 3 VMs free
   - More complex setup
   - Better performance

3. **Cyclic** (Free tier)
   - Easy deployment
   - Limited resources
   - Good for small apps

### Frontend Alternatives:
1. **Netlify** (Free tier)
   - Similar to Vercel
   - 100GB bandwidth
   - Good for Next.js

2. **Cloudflare Pages** (Free tier)
   - Unlimited bandwidth
   - Fast CDN
   - Good for static sites

## Monitoring Your Free Deployment

### Render:
- Dashboard → Logs (real-time)
- Dashboard → Metrics (CPU, memory)
- Email alerts for failures

### Vercel:
- Dashboard → Analytics
- Dashboard → Logs
- Real-time deployment status

## Keeping Your Free Tier Active

### Render Database (90-day limit):
- Set calendar reminder for day 85
- Export data: `pg_dump`
- Create new database
- Import data
- Update DATABASE_URL

### Prevent Spin Down (Optional):
- Use UptimeRobot (free) to ping your backend every 5 minutes
- Note: This uses your 750 hours faster

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Test the application
4. 🔒 Change default passwords
5. 🔒 Update JWT_SECRET to secure value
6. 📧 Configure email (optional)
7. 🌐 Add custom domain (optional)
8. 📊 Set up monitoring

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: [Your repo]

---

**Estimated Setup Time**: 20-30 minutes
**Total Cost**: $0/month 🎉
