# Security Implementation Guide

## Overview
This portfolio now has comprehensive security features implemented for the Express backend server.

## What Was Implemented

### 1. **Rate Limiting**
- Login endpoint: 5 attempts per 15 minutes per IP
- Automatic blocking after limit exceeded
- Reset time provided in error message
- In-memory store (upgrade to Redis for production scaling)

### 2. **reCAPTCHA v3 Integration**
- Validates on every login attempt
- Score threshold: 0.5 (adjustable)
- Gracefully handles missing configuration
- Site key: `6Ld-EO0sAAAADEUcuo8jPm1u_sBsa2xwhq9t-JfX`

### 3. **Session Management**
- Secure token generation (crypto.randomBytes)
- 15-minute token expiry
- Auto-refresh at 5 minutes remaining
- Tokens stored in `admin_sessions` table
- Automatic cleanup of expired sessions

### 4. **Audit Logging**
- All login attempts logged (success/failure)
- Token refreshes tracked
- Logout actions recorded
- IP addresses and timestamps captured
- Stored in `audit_logs` table

### 5. **Email Notifications**
- Login success/failure alerts
- Sent to admin email
- Includes IP address, user agent, timestamp
- Uses Resend API (requires API key)

### 6. **Page View Analytics**
- Tracks all page views
- Bot detection (crawlers, social media bots)
- Separate real/bot counts
- Stored in `page_views` table

### 7. **Secure Admin Interface**
- Session countdown timer
- Manual refresh button
- Secure logout (clears tokens)
- Activity tracking (prevents idle timeout)
- reCAPTCHA widget on login
- Password visibility toggle

## New API Endpoints

### Public Endpoints

#### `POST /admin/login`
Login with password and reCAPTCHA validation.

**Request:**
```json
{
  "password": "portfolio2026",
  "recaptchaToken": "google_recaptcha_token"
}
```

**Response (Success):**
```json
{
  "token": "abc123...",
  "expiresIn": 900,
  "expiresAt": "2026-01-16T12:00:00.000Z"
}
```

**Response (Rate Limited):**
```json
{
  "error": "Too many login attempts. Please try again later.",
  "resetTime": 1705412400000
}
```

#### `POST /analytics/page-view`
Track page views (called automatically by frontend).

**Request:**
```json
{
  "path": "/"
}
```

### Protected Endpoints (Require Bearer Token)

#### `POST /admin/refresh-token`
Refresh session token before expiry.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "token": "new_token...",
  "expiresIn": 900,
  "expiresAt": "2026-01-16T12:15:00.000Z"
}
```

#### `POST /admin/logout`
Deactivate session token.

**Headers:**
```
Authorization: Bearer {token}
```

#### `GET /admin/logs?type=audit&days=7`
Get audit logs or analytics.

**Query Parameters:**
- `type`: `audit` or `analytics`
- `days`: Number of days to retrieve (default: 7)

**Response (type=audit):**
```json
{
  "logs": [...],
  "successfulLogins": 15,
  "failedLogins": 3
}
```

**Response (type=analytics):**
```json
{
  "views": [...],
  "realViews": 120,
  "botViews": 45,
  "viewsByPath": { "/": 80, "/admin": 40 },
  "topPages": [{ "path": "/", "count": 80 }]
}
```

## Environment Variables

Add these to your server environment (Vercel, Docker, etc.):

### Required
```env
SUPABASE_URL=https://notworthy.vip
SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=portfolio2026
```

### Optional (Recommended)
```env
# Email Notifications
RESEND_API_KEY=re_NyiNfA9b_P4y98A2VBdhsrL9JDy1BPnjw
EMAIL_FROM=admin@notworthy.vip

# reCAPTCHA
RECAPTCHA_SECRET_KEY=6Ld-EO0sAAAABRlM5uAVK-c8rmoQCCHhSfpvCkEC

# Backward compatibility
ADMIN_API_SECRET=your_old_secret
```

### Frontend Environment Variables (.env.local)
```env
VITE_ADMIN_API_BASE=http://localhost:4001
VITE_RECAPTCHA_SITE_KEY=6Ld-EO0sAAAADEUcuo8jPm1u_sBsa2xwhq9t-JfX
```

## Setup Instructions

### 1. Install Server Dependencies
```bash
cd server
npm install resend cookie-parser
```

### 2. Database Migration (Already Done)
The following tables should exist in Supabase:
- `audit_logs`
- `page_views`
- `admin_sessions`
- `admin_settings` (existing)
- `activity_logs` (existing)

### 3. Update Frontend Component
Replace `src/Admin.tsx` with `src/Admin-secure.tsx`:
```bash
cp src/Admin-secure.tsx src/Admin.tsx
```

### 4. Test Locally
```bash
# Start server
cd server
npm start

# In another terminal, start frontend
cd ..
npm run dev
```

Visit `http://localhost:5173/admin` and test:
- Login with password: `portfolio2026`
- Verify reCAPTCHA loads
- Check session countdown timer
- Test refresh button
- Test logout

### 5. Deployment

#### Server (Docker/VPS)
1. Add environment variables to your deployment platform
2. Deploy updated `server/index.js`
3. Restart server

#### Frontend (Vercel/Netlify)
1. Add `VITE_ADMIN_API_BASE` to environment variables (your server URL)
2. Add `VITE_RECAPTCHA_SITE_KEY` to environment variables
3. Deploy frontend

#### Vercel Deployment
1. Run deployment checks: `npm run check:deploy`
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys

## Testing Checklist

- [ ] **Login Flow**
  - Enter correct password → Should login successfully
  - Enter wrong password → Should show error
  - Try 6+ wrong passwords → Should rate limit (429 error)
  - Check reCAPTCHA badge appears on login page

- [ ] **Session Management**
  - After login, verify countdown timer shows
  - Wait for timer to reach <5 mins → Should auto-refresh
  - Click Refresh button → Should manually refresh token
  - Let session expire → Should auto-logout

- [ ] **Logout**
  - Click Logout button → Should clear session and return to login
  - Verify token is deactivated in database

- [ ] **Audit Logs**
  - Login successfully → Check `audit_logs` table for entry
  - Failed login → Check `audit_logs` for failed entry
  - Verify IP address and timestamp captured

- [ ] **Email Notifications**
  - Login → Check admin email for notification
  - Failed login → Check for failure alert email

- [ ] **Page View Tracking**
  - Visit homepage → Check `page_views` table
  - Verify bot detection works (test with curl)

- [ ] **Analytics Dashboard**
  - Access `/admin/logs?type=audit` (with token)
  - Access `/admin/logs?type=analytics` (with token)
  - Verify real vs bot view counts

## Security Best Practices

✅ **Implemented:**
- Rate limiting on login
- reCAPTCHA validation
- Secure token generation
- Session expiry (15 min)
- Audit logging
- Bot detection
- Email notifications
- HTTPS recommended (handled by deployment platform)

⚠️ **Recommended for Production:**
- Upgrade rate limiting to Redis (for horizontal scaling)
- Add IP allowlist for admin access
- Enable CORS only for your domain
- Add Content Security Policy headers
- Monitor audit logs for suspicious patterns
- Set up alerting for failed login spikes
- Rotate admin password regularly
- Use environment-specific reCAPTCHA keys

## Troubleshooting

### "reCAPTCHA not loaded"
- Check internet connection
- Verify `VITE_RECAPTCHA_SITE_KEY` is set
- Check browser console for errors
- Try refreshing the page

### "Too many login attempts"
- Wait 15 minutes for rate limit to reset
- Check server logs for IP address
- Clear rate limit manually if needed (restart server)

### "Session expired" immediately
- Check server time is synchronized
- Verify token expiry calculation
- Check Supabase `admin_sessions` table

### Email notifications not working
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify domain is verified in Resend
- Check server logs for email send errors

### Admin dashboard not loading
- Verify server is running
- Check `VITE_ADMIN_API_BASE` points to correct server URL
- Check browser console for CORS errors
- Verify bearer token is included in requests

## Migration from Old System

If upgrading from the old `ADMIN_API_SECRET` token system:

1. Old endpoints still work (backward compatible):
   - `GET /admin/settings` (with `x-admin-token` header)
   - `PUT /admin/settings` (with `x-admin-token` header)
   - `GET /admin/activity-logs` (with `x-admin-token` header)

2. New secure endpoints:
   - `POST /admin/login` (password + reCAPTCHA)
   - `POST /admin/refresh-token` (Bearer token)
   - `POST /admin/logout` (Bearer token)
   - `GET /admin/logs` (Bearer token)

3. Frontend can use either:
   - Old: Static `ADMIN_API_SECRET` token
   - New: Dynamic session tokens from login

## Performance Considerations

- **In-Memory Rate Limiting:** Resets on server restart. For production with multiple instances, use Redis.
- **Session Cleanup:** Inactive sessions remain in database. Add cron job to delete expired sessions.
- **Analytics Storage:** `page_views` table grows indefinitely. Add archival/cleanup strategy.

## Support & Questions

- **Documentation:** See `DEPLOYMENT_CHECKLIST.md` for full deployment guide
- **Database Schema:** See `migrations/security_schema.sql`
- **Deployment Checks:** Run `npm run check:deploy` before deploying

---

**Last Updated:** January 16, 2026  
**Security Version:** 2.0.0  
**Framework:** Vite + React + Express
