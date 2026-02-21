# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] GitHub account created
- [ ] Code pushed to GitHub repository
- [ ] 20-30 minutes available

---

## 📦 Backend Deployment (Render.com)

### 1. Create Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Verify email

### 2. Create PostgreSQL Database
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `optileave-db`
- [ ] Plan: **Free**
- [ ] Click "Create Database"
- [ ] **Copy Internal Database URL** ⚠️

### 3. Create Redis
- [ ] Click "New +" → "Redis"
- [ ] Name: `optileave-redis`
- [ ] Plan: **Free**
- [ ] Click "Create Redis"
- [ ] **Copy Internal Redis URL** ⚠️

### 4. Deploy Backend
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo
- [ ] Name: `optileave-backend`
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install && npx prisma generate && npm run build`
- [ ] Start Command: `npx prisma migrate deploy && npm start`
- [ ] Plan: **Free**

### 5. Add Environment Variables
```
DATABASE_URL = [paste from step 2]
REDIS_URL = [paste from step 3]
JWT_SECRET = [generate 32+ character random string]
JWT_EXPIRATION = 8h
NODE_ENV = production
PORT = 4000
```

- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes
- [ ] **Copy your backend URL**: `https://optileave-backend.onrender.com`
- [ ] Test: Visit `https://optileave-backend.onrender.com/health`

---

## 🎨 Frontend Deployment (Vercel)

### 1. Create Account
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub
- [ ] Verify email

### 2. Deploy Frontend
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repo
- [ ] Root Directory: `frontend`
- [ ] Framework: Next.js (auto-detected)

### 3. Add Environment Variables
```
NEXT_PUBLIC_API_URL = https://optileave-backend.onrender.com
NEXT_PUBLIC_WS_URL = wss://optileave-backend.onrender.com
```

- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] **Copy your frontend URL**: `https://optileave-xxx.vercel.app`

---

## 🔧 Final Configuration

### Update Backend CORS
- [ ] Go to Render → Backend Service → Environment
- [ ] Add variable:
  ```
  FRONTEND_URL = https://optileave-xxx.vercel.app
  ```
- [ ] Click "Save Changes" (auto-redeploys)

---

## ✅ Testing

- [ ] Visit your Vercel URL
- [ ] Try login:
  - Email: `admin@example.com`
  - Password: `password123`
- [ ] Submit a test leave request
- [ ] Check if data persists after refresh

---

## 🔒 Security (IMPORTANT!)

- [ ] Change default admin password
- [ ] Update JWT_SECRET to secure random string
- [ ] Delete test users (optional)
- [ ] Review CORS settings

---

## 📝 Save These URLs

```
Frontend: https://optileave-xxx.vercel.app
Backend: https://optileave-backend.onrender.com
Database: [Render Dashboard]
Redis: [Render Dashboard]
```

---

## ⚠️ Known Issues (Free Tier)

**Backend slow on first load?**
- Normal! Render free tier spins down after 15 min
- First request takes 30-50 seconds
- Subsequent requests are fast

**Database expires in 90 days?**
- Set calendar reminder
- Export and recreate database
- Or upgrade to paid plan ($7/month)

---

## 🎉 You're Done!

Your app is now live and accessible worldwide for FREE!

**Next Steps:**
1. Share your URL with users
2. Monitor usage in dashboards
3. Consider custom domain
4. Set up monitoring (UptimeRobot)

---

## 📞 Need Help?

- Check `DEPLOY_FREE.md` for detailed guide
- Check platform logs for errors
- Open GitHub issue
- Platform docs:
  - Render: https://render.com/docs
  - Vercel: https://vercel.com/docs
