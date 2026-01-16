# 🚀 Deployment Checklist & Next Steps

Your portfolio with GitHub sync and admin dashboard is now ready for deployment!

## ✅ What's Been Completed

- ✅ Docker Compose setup for self-hosted Supabase
- ✅ PostgreSQL with RLS policies and activity logging
- ✅ GitHub API integration (profile + repos sync)
- ✅ Supabase Authentication (GitHub OAuth)
- ✅ Admin Dashboard with settings & logs
- ✅ NGINX reverse proxy configuration
- ✅ React components with loading/error states
- ✅ Production build (tested & working)

## 📋 Pre-Deployment Checklist

### Step 1: Create GitHub OAuth App
- [ ] Go to https://github.com/settings/developers
- [ ] Click "New OAuth App"
- [ ] Fill form:
  - App name: "Portfolio"
  - Homepage URL: `https://notworthy.vip`
  - Authorization callback: `https://notworthy.vip/auth/v1/callback`
- [ ] Copy **Client ID** and **Client Secret**

### Step 2: Configure Supabase Environment
- [ ] Copy `.env.supabase.example` to `.env.supabase`
- [ ] Edit `.env.supabase`:
  - Set `GITHUB_CLIENT_ID` (from step 1)
  - Set `GITHUB_SECRET` (from step 1)
  - Change `POSTGRES_PASSWORD` (strong password)
  - Change `JWT_SECRET` (min 32 random characters)
  - Verify `API_EXTERNAL_URL=https://notworthy.vip`
  - Verify `SITE_URL=https://notworthy.vip`

### Step 3: Start Supabase
```bash
cd /data/portfolio
source .env.supabase
docker-compose up -d
docker-compose ps  # Wait until all are healthy/running (2-3 min)
```

### Step 4: Initialize Database Schema
Use Supabase Studio:
```bash
# Open in browser
http://localhost:3001

# Login with: supabase / this_password_is_insecure_and_should_be_updated
# Go to SQL Editor
# Copy entire contents of: volumes/db/init-schema.sql
# Paste & execute
```

### Step 5: Get Supabase Keys
From Studio (http://localhost:3001):
1. Click your project name (top-left)
2. Go to Settings → API
3. Copy **Anon Public Key** (starts with `eyJ...`)

### Step 6: Frontend Configuration
Create `.env.local`:
```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://notworthy.vip
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
VITE_GITHUB_USER=Hany-hazem
EOF
```

### Step 7: Build & Deploy
```bash
npm install
npm run build

# Copy to NGINX (with sudo password when prompted)
sudo cp -r dist/* /usr/share/nginx/html/
sudo systemctl reload nginx
```

### Step 8: Test the Site
- [ ] Visit https://notworthy.vip
- [ ] Verify GitHub profile loads (name, avatar, repos)
- [ ] Click GitHub button to test OAuth login
- [ ] Access admin dashboard after login

## 🔧 Quick Commands Reference

```bash
# View Supabase status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth    # Auth service
docker-compose logs -f db      # Database
docker-compose logs -f kong    # API Gateway

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Studio admin UI
http://localhost:3001

# Build frontend
npm run build

# Dev server
npm run dev

# Reload NGINX
sudo systemctl reload nginx

# View NGINX logs
sudo tail -f /var/log/nginx/error.log
```

## 🐛 Troubleshooting

### Supabase Services Won't Start
```bash
# Check what's running
docker-compose ps

# View detailed logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d
```

### GitHub OAuth Fails
1. Verify callback URL matches exactly in GitHub app
2. Check Client ID/Secret in `.env.supabase`
3. Ensure Auth service is running: `docker-compose logs auth`
4. Check browser console for error messages

### Database Schema Didn't Apply
1. Connect via Studio at http://localhost:3001
2. Go to SQL Editor
3. Paste `volumes/db/init-schema.sql` and execute
4. Verify tables exist: `SELECT * FROM user_settings LIMIT 1;`

### Portfolio Shows "Failed to load GitHub data"
1. Check `.env.local` has correct `VITE_SUPABASE_URL` and key
2. Verify NGINX can reach Kong: `curl http://localhost:8000/`
3. Check browser Network tab for `/rest/*` requests
4. View Kong logs: `docker-compose logs kong`

### NGINX Can't Reach Supabase APIs
1. Confirm Kong is running: `docker-compose ps kong`
2. Test connection: `curl http://localhost:8000/`
3. Check Kong config: `volumes/api/kong.yml`
4. Reload NGINX: `sudo systemctl reload nginx`

## 📊 Monitoring

### Check Database Activity
```bash
# Connect to PostgreSQL
docker exec -it supabase-db psql -U supabase_admin -d postgres

# List tables
\dt

# View activity logs
SELECT * FROM public.activity_logs ORDER BY created_at DESC LIMIT 10;

# View user settings
SELECT * FROM public.user_settings;
```

### View API Traffic
```bash
# Kong logs
docker-compose logs -f kong

# Auth logs
docker-compose logs -f auth

# NGINX logs
sudo tail -f /var/log/nginx/access.log
```

## 🔐 Security Notes

- **JWT_SECRET:** Keep this secret, don't commit to git
- **POSTGRES_PASSWORD:** Use a strong password
- **GitHub OAuth Secret:** Never share publicly
- **.env.supabase:** Add to `.gitignore`
- **.env.local:** Add to `.gitignore`
- **RLS Policies:** Enabled on `user_settings` and `activity_logs`
- **HTTPS:** Cloudflare Tunnel encrypts traffic

## 📈 Next Steps (Optional)

1. **Custom Domain Email:** Configure SMTP in `.env.supabase` for auth emails
2. **Backup Strategy:** Set up cron job: `0 2 * * * pg_dump ... > backup.sql`
3. **Monitor Logs:** Use Supabase's Logflare or Vector for centralized logging
4. **GitHub Token:** Add `VITE_GITHUB_TOKEN` for pinned repos (GraphQL)
5. **Performance:** Cache GitHub data with TTL in browser localStorage
6. **Analytics:** Integrate Plausible or Umami for private analytics

## 📝 Files Created/Modified

**New Files:**
- `docker-compose.yml` - Supabase infrastructure
- `.env.supabase.example` - Environment template
- `src/lib/supabase.ts` - Supabase client
- `src/services/github.ts` - GitHub API service
- `src/components/AdminDashboard.tsx` - Admin UI
- `volumes/db/init-schema.sql` - Database schema
- `volumes/api/kong.yml` - API Gateway config

**Modified Files:**
- `src/App.tsx` - GitHub data integration
- `nginx.conf` - Supabase API routing
- `README.md` - Documentation

**No Breaking Changes:** All original portfolio content preserved; GitHub data supplements existing sections.

## ✨ Features Now Available

✅ **GitHub Sync**
- Real-time profile data (name, avatar, bio, location)
- Latest repositories with stars, languages, topics
- Auto-refresh on page load

✅ **Admin Dashboard**
- Settings: customize repo display, override bio
- Activity Logs: track all fetch events and errors
- User-specific data isolation via RLS

✅ **Authentication**
- GitHub OAuth login
- Secure session management
- Email-based password recovery (optional SMTP)

✅ **Monitoring**
- Activity logging to database
- Error tracking and reporting
- Audit trail for admin actions

---

**Questions?** Check the [README.md](./README.md) for full documentation.  
**Need help?** Review the Troubleshooting section above or check Docker logs.

Good luck! 🎉
