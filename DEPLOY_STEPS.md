# 🚀 Deploy in 5 Simple Steps

## Step 1️⃣: Prepare Your Code (2 min)

```bash
# Push your code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 2️⃣: Deploy Backend to Render (10 min)

### A. Create Database & Redis
1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New +"** → **"PostgreSQL"**
   - Name: `optileave-db`
   - Plan: **Free** ✅
   - Click "Create Database"
   - 📋 **Copy "Internal Database URL"**

3. Click **"New +"** → **"Redis"**
   - Name: `optileave-redis`
   - Plan: **Free** ✅
   - Click "Create Redis"
   - 📋 **Copy "Internal Redis URL"**

### B. Deploy Backend Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Fill in:
   ```
   Name: optileave-backend
   Root Directory: backend
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npx prisma migrate deploy && npm start
   Plan: Free ✅
   ```

4. Click **"Advanced"** → Add Environment Variables:
   ```
   DATABASE_URL = [paste Internal Database URL]
   REDIS_URL = [paste Internal Redis URL]
   JWT_SECRET = my_super_secure_secret_key_12345678901234567890
   JWT_EXPIRATION = 8h
   NODE_ENV = production
   PORT = 4000
   ```

5. Click **"Create Web Service"**
6. ⏳ Wait 5-10 minutes for deployment
7. 📋 **Copy your backend URL**: `https://optileave-backend.onrender.com`
8. ✅ Test: Visit `https://optileave-backend.onrender.com/health`

---

## Step 3️⃣: Deploy Frontend to Vercel (5 min)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Fill in:
   ```
   Root Directory: frontend
   Framework Preset: Next.js (auto-detected)
   ```

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://optileave-backend.onrender.com
   NEXT_PUBLIC_WS_URL = wss://optileave-backend.onrender.com
   ```

6. Click **"Deploy"**
7. ⏳ Wait 2-3 minutes
8. 📋 **Copy your frontend URL**: `https://optileave-xxx.vercel.app`

---

## Step 4️⃣: Connect Frontend & Backend (2 min)

1. Go back to **Render** → Your backend service
2. Click **"Environment"** tab
3. Add new variable:
   ```
   FRONTEND_URL = https://optileave-xxx.vercel.app
   ```
4. Click **"Save Changes"** (auto-redeploys)
5. ⏳ Wait 2-3 minutes for redeployment

---

## Step 5️⃣: Test Your App (1 min)

1. Visit your Vercel URL: `https://optileave-xxx.vercel.app`
2. Login with:
   ```
   Email: admin@example.com
   Password: password123
   ```
3. 🎉 **Success!** Your app is live!

---

## 📱 Your Live URLs

```
✅ Frontend: https://optileave-xxx.vercel.app
✅ Backend: https://optileave-backend.onrender.com
✅ Health Check: https://optileave-backend.onrender.com/health
```

---

## ⚠️ Important Notes

### First Load is Slow?
- **Normal!** Render free tier spins down after 15 minutes
- First request takes 30-50 seconds to wake up
- After that, it's fast!

### Database Expires in 90 Days?
- Render free PostgreSQL expires after 90 days
- Set a reminder to export and recreate
- Or upgrade to paid ($7/month for always-on)

---

## 🔒 Security Checklist

After deployment, immediately:
- [ ] Change admin password (login → profile → change password)
- [ ] Update JWT_SECRET to a more secure value
- [ ] Review user list and remove test accounts

---

## 🐛 Troubleshooting

### "Failed to fetch" error?
- Wait 30-50 seconds (backend waking up)
- Check backend health: `https://optileave-backend.onrender.com/health`
- Verify NEXT_PUBLIC_API_URL is correct in Vercel

### Login not working?
- Check browser console for errors
- Verify CORS: FRONTEND_URL in Render matches your Vercel URL
- Check Render logs: Dashboard → Logs

### Database connection error?
- Ensure you used "Internal Database URL" (not External)
- Check DATABASE_URL in Render environment variables
- Verify database is in same region as backend

---

## 💰 Cost: $0/month

Both platforms are completely FREE:
- ✅ Render: 750 hours/month (enough for 1 service)
- ✅ Vercel: Unlimited deployments, 100GB bandwidth
- ✅ PostgreSQL: 1GB storage
- ✅ Redis: 30MB storage

---

## 🎯 Next Steps

1. Share your URL with team members
2. Set up custom domain (optional)
3. Configure email notifications (optional)
4. Monitor usage in dashboards
5. Consider upgrading if you need:
   - Always-on backend ($7/month)
   - More database storage
   - Better performance

---

## 📚 More Resources

- **Detailed Guide**: [DEPLOY_FREE.md](./DEPLOY_FREE.md)
- **Quick Checklist**: [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
- **Docker Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## 🎉 Congratulations!

Your OptiLeave app is now live and accessible worldwide!

**Total Time**: ~20 minutes
**Total Cost**: $0/month
**Reach**: Global 🌍
