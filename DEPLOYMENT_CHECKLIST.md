# Deployment Checklist

This checklist ensures all security features and configurations are properly set up before deploying to production.

## ✅ Automated Checks

Run this command to validate all environment variables:

```bash
npm run check:deploy
```

This will automatically check:
- ✓ Supabase URL and API keys
- ✓ Email service configuration (Resend)
- ✓ reCAPTCHA keys
- ✓ OAuth2 credentials (GitHub & Google)
- ✓ Base URL configuration

The build will **automatically fail** if critical environment variables are missing.

---

## 📋 Manual Pre-Deployment Checklist

### 1. **Environment Variables (Vercel Dashboard)**

Go to your Vercel project → **Settings** → **Environment Variables** and add:

#### Required (Critical):
- [ ] `VITE_SUPABASE_URL` = `https://notworthy.vip`
- [ ] `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = (your reCAPTCHA site key)
- [ ] `RECAPTCHA_SECRET_KEY` = (your reCAPTCHA secret key)
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://www.notworthy.vip`

#### Email Service (Required for notifications):
- [ ] `RESEND_API_KEY` = (your Resend API key starting with `re_`)
- [ ] `EMAIL_FROM` = `admin@notworthy.vip`

#### OAuth2 (Optional - for social login):
- [ ] `GITHUB_OAUTH_ID` = (your GitHub OAuth Client ID)
- [ ] `GITHUB_OAUTH_SECRET` = (your GitHub OAuth Client Secret)
- [ ] `GOOGLE_OAUTH_ID` = (your Google OAuth Client ID)
- [ ] `GOOGLE_OAUTH_SECRET` = (your Google OAuth Client Secret)

#### Portfolio:
- [ ] `VITE_GITHUB_USER` = `Hany-hazem`

---

### 2. **Database Migration (Supabase)**

- [ ] Run the SQL migration in Supabase SQL Editor:
  - Go to: https://supabase.com/dashboard → Your Project → SQL Editor
  - Paste content from `migrations/security_schema.sql`
  - Click **Run** (creates audit_logs, page_views, admin_sessions tables)
  - Verify tables exist in **Table Editor**

---

### 3. **Email Domain Verification (Resend)**

- [ ] Add `notworthy.vip` to Resend Dashboard → Domains
- [ ] Add DNS records (MX, TXT, CNAME) to Cloudflare
- [ ] Wait for verification (5-10 mins)
- [ ] Verify domain shows ✅ in Resend

---

### 4. **OAuth2 Setup (Optional)**

#### GitHub OAuth:
- [ ] Create OAuth App at: https://github.com/settings/developers
- [ ] Set Authorization callback URL: `https://www.notworthy.vip/api/auth/github/callback`
- [ ] Copy Client ID and Client Secret to Vercel environment variables

#### Google OAuth:
- [ ] Create OAuth App at: https://console.cloud.google.com
- [ ] Add Authorized redirect URI: `https://www.notworthy.vip/api/auth/google/callback`
- [ ] Copy Client ID and Client Secret to Vercel environment variables

---

### 5. **reCAPTCHA Production Keys**

- [ ] Replace test keys with production keys:
  - Go to: https://www.google.com/recaptcha/admin
  - Create new site for `notworthy.vip`
  - Choose reCAPTCHA v3
  - Copy Site Key → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
  - Copy Secret Key → `RECAPTCHA_SECRET_KEY`

---

### 6. **Security Configuration Verification**

- [ ] Admin password is set to: `portfolio2026` (in code)
- [ ] Session timeout: 60 minutes (15-min token expiry with auto-refresh)
- [ ] Rate limiting: 5 login attempts per 15 minutes
- [ ] HTTP-only cookies enabled for session tokens
- [ ] Middleware protection active on `/api/admin/*` routes

---

### 7. **Test Security Features**

After deployment, test each security layer:

#### Login Flow:
- [ ] Visit `/admin`
- [ ] Enter password: `portfolio2026`
- [ ] Verify reCAPTCHA appears
- [ ] Verify login successful
- [ ] Check session countdown timer shows (60:00)

#### Rate Limiting:
- [ ] Try wrong password 6+ times
- [ ] Verify "Too many attempts" error (429)

#### Session Management:
- [ ] After login, verify token refresh button works
- [ ] Wait for countdown to reach 5 minutes
- [ ] Verify auto-refresh happens
- [ ] Click logout, verify cleared

#### Audit Logging:
- [ ] Login successfully
- [ ] Check Supabase `audit_logs` table
- [ ] Verify login entry exists with IP, timestamp, success=true

#### Page View Tracking:
- [ ] Visit `/` (portfolio homepage)
- [ ] Check Supabase `page_views` table
- [ ] Verify entry exists with path, is_bot, IP, user_agent

#### Email Notifications:
- [ ] Login to admin
- [ ] Check `admin@notworthy.vip` inbox
- [ ] Verify login notification email received

#### OAuth2 (if enabled):
- [ ] Click "Login with GitHub" button
- [ ] Complete GitHub authorization
- [ ] Verify redirected back to admin
- [ ] Same test for Google OAuth

---

### 8. **Monitoring & Alerts**

- [ ] Set up email alerts for failed login attempts
- [ ] Monitor audit logs weekly for suspicious activity
- [ ] Check page view analytics for bot traffic patterns
- [ ] Review session tokens for expired/inactive sessions

---

## 🚀 Deployment Steps

1. **Run automated checks:**
   ```bash
   npm run check:deploy
   ```

2. **Commit and push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Vercel automatically deploys** (if connected to GitHub)

4. **Verify deployment:**
   - Check Vercel deployment logs
   - Visit https://www.notworthy.vip
   - Test admin login at https://www.notworthy.vip/admin

---

## 🔧 Troubleshooting

**Build fails with missing environment variable:**
- Add it to Vercel Dashboard → Environment Variables
- Redeploy

**Email notifications not working:**
- Verify Resend API key is correct
- Check domain verification status
- Check Resend logs for errors

**OAuth login fails:**
- Verify callback URLs match exactly
- Check OAuth client IDs/secrets are correct
- Ensure redirect URIs are added to provider dashboard

**reCAPTCHA not working:**
- Replace test keys with production keys
- Verify domain is whitelisted in reCAPTCHA settings

**Database errors:**
- Verify SQL migration ran successfully
- Check Supabase service role has permissions
- Verify RLS policies are enabled

---

## 📊 Security Metrics Dashboard

Access analytics and audit logs via API:

- **Audit Logs:** `GET /api/admin/logs?type=audit`
- **Page Analytics:** `GET /api/admin/logs?type=analytics`

Both require admin authentication (cookie-based).

---

## 🔒 Security Best Practices

✅ **Implemented:**
- Rate limiting on login endpoint
- reCAPTCHA on admin login
- HTTP-only cookies for session tokens
- Token rotation every 15 minutes
- Session timeout after 60 minutes
- Audit logging for all admin actions
- Bot detection for page views
- Email notifications for logins
- OAuth2 with CSRF protection

⚠️ **Recommended (Future):**
- Convert rate limiting to Redis (for multi-instance scaling)
- Add 2FA (TOTP or SMS)
- Add IP allowlist for admin access
- Add session revocation list
- Add brute force detection
- Add Content Security Policy headers
- Add HTTPS-only enforcement

---

## 📝 Post-Deployment

- [ ] Share access with team (if applicable)
- [ ] Document any custom configuration changes
- [ ] Set calendar reminder for monthly security review
- [ ] Monitor Vercel logs for unusual activity
- [ ] Update reCAPTCHA keys if using test keys

---

**Last Updated:** January 16, 2026  
**Security Version:** 1.0.0
