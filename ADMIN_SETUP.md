# Admin Subdomain Setup

## What Changed

1. **Removed login/admin UI from main portfolio** (https://notworthy.vip)
   - No more login button or admin settings in navigation
   - Clean portfolio site focused on your work

2. **Created separate admin page** accessible at `/admin` or `admin.notworthy.vip`
   - Login page with GitHub OAuth
   - Full admin dashboard for managing settings and viewing logs

## Setup admin.notworthy.vip in Nginx Proxy Manager

1. **Log into your Nginx Proxy Manager** (usually at http://your-server:81)

2. **Add a new Proxy Host:**
   - Domain Names: `admin.notworthy.vip`
   - Scheme: `http`
   - Forward Hostname/IP: `portfolio`
   - Forward Port: `80`
   - Cache Assets: ✓ (enabled)
   - Block Common Exploits: ✓ (enabled)
   - Websockets Support: ✓ (enabled)

3. **SSL Tab:**
   - SSL Certificate: Request a new Let's Encrypt certificate for `admin.notworthy.vip`
   - Force SSL: ✓ (enabled)
   - HTTP/2 Support: ✓ (enabled)

4. **Save** the configuration

## Alternative: Access via /admin Path

If you don't want to set up a subdomain, you can access the admin dashboard at:
- https://notworthy.vip/admin

The app automatically detects both routes:
- Subdomain: `admin.notworthy.vip` → Admin page
- Path: `/admin` on main domain → Admin page
- Root: `notworthy.vip` → Portfolio

## Testing

1. Visit https://notworthy.vip - Should show your portfolio without login button
2. Visit https://notworthy.vip/admin - Should show admin login page
3. (After subdomain setup) Visit https://admin.notworthy.vip - Should show admin login page

## What's Working

- ✅ Main portfolio loads GitHub data dynamically
- ✅ Admin dashboard separated from main site
- ✅ GitHub OAuth login for admin access
- ✅ Settings and activity logs in admin panel
- ✅ API requests properly proxied to Supabase
