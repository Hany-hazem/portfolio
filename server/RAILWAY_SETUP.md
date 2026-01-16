# Railway Deployment Guide

## Quick Setup (5 minutes)

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub (free tier: 500 hours/month)

### 2. Deploy Your Server

**From your terminal:**

```bash
cd server

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# When prompted, choose:
# - "Create a new project"
# - Name it: "portfolio-api"

# Deploy
railway up
```

### 3. Add Environment Variables

In Railway Dashboard (https://railway.app/dashboard):

1. Click on your `portfolio-api` project
2. Go to **Variables** tab
3. Click **+ New Variable** and add each:

```env
SUPABASE_URL=https://notworthy.vip
SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_PASSWORD=portfolio2026
RESEND_API_KEY=re_NyiNfA9b_P4y98A2VBdhsrL9JDy1BPnjw
EMAIL_FROM=admin@notworthy.vip
RECAPTCHA_SECRET_KEY=6Ld-EO0sAAAABRlM5uAVK-c8rmoQCCHhSfpvCkEC
PORT=4001
```

4. Click **Deploy** (Railway will auto-redeploy)

### 4. Get Your Server URL

1. In Railway Dashboard, go to **Settings** tab
2. Click **Generate Domain** under "Domains"
3. Copy the URL (e.g., `https://portfolio-api-production-xxxx.up.railway.app`)

### 5. Update Vercel Frontend

1. Go to https://vercel.com/dashboard
2. Select your portfolio project
3. Go to **Settings** → **Environment Variables**
4. Add/Update:

```
VITE_ADMIN_API_BASE=https://portfolio-api-production-xxxx.up.railway.app
VITE_RECAPTCHA_SITE_KEY=6Ld-EO0sAAAADEUcuo8jPm1u_sBsa2xwhq9t-JfX
```

5. Go to **Deployments** tab
6. Click **⋯** on latest deployment → **Redeploy**

### 6. Test Your Admin

1. Visit `https://www.notworthy.vip/admin`
2. Enter password: `portfolio2026`
3. Verify reCAPTCHA loads
4. Check session countdown timer works
5. Test logout button

## Verify Deployment

Check if your API is running:
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{"ok":true,"service":"admin-api","time":"2026-01-16T..."}
```

## Update Backend Code

To deploy changes:
```bash
cd server
git add .
git commit -m "update: your changes"
railway up
```

Or enable auto-deployment from GitHub:
1. Railway Dashboard → Settings
2. Connect to GitHub repository
3. Enable auto-deploy on push

## Troubleshooting

### Server not starting
- Check Railway logs: Dashboard → Deployments → View Logs
- Verify all environment variables are set
- Check PORT is set to 4001

### CORS errors on frontend
- Add your Vercel domain to CORS whitelist in server/index.js
- Redeploy: `railway up`

### Database connection failed
- Verify SUPABASE_URL and SERVICE_ROLE_KEY are correct
- Check Supabase is accessible from Railway (should be)

### Email not sending
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for errors
- Verify domain is verified in Resend

## Cost

Railway Free Tier:
- ✅ 500 execution hours/month
- ✅ 1 GB RAM
- ✅ 1 GB Disk
- ✅ Shared CPU

Your API uses minimal resources, should stay free.

## Alternative: GitHub Auto-Deploy

1. In Railway Dashboard:
   - Settings → Connect to GitHub
   - Select repository: `Hany-hazem/portfolio` (or your repo)
   - Root directory: `/server`
   - Enable "Auto-Deploy"

2. Now every `git push` auto-deploys to Railway!

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
