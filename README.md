# Portfolio with GitHub Sync & Admin Dashboard

A modern, self-hosted portfolio website that syncs with your GitHub profile and includes an admin dashboard for customization and activity logging. Built with React, TypeScript, Vite, Tailwind CSS, and self-hosted Supabase.

## Features

✨ **GitHub Integration**
- Dynamically sync profile data (name, avatar, bio, location)
- Auto-fetch latest GitHub repositories with stars, languages, and topics
- Real-time profile updates

🔐 **Authentication**
- GitHub OAuth login via self-hosted Supabase
- Secure session management
- Activity logging

⚙️ **Admin Dashboard**
- Customize repository display (most recent, most starred, pinned)
- Override bio and display name
- View activity logs and fetch statistics
- Settings persistence

🚀 **Deployment**
- Self-hosted Supabase with Docker Compose
- NGINX reverse proxy with Cloudflare Tunnel
- Static SPA with client-side rendering
- Zero external service dependencies (except GitHub API)

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Self-hosted Supabase (PostgreSQL, Auth, REST API, Realtime)
- **Database:** PostgreSQL (via Supabase)
- **Icons:** Lucide React
- **Hosting:** NGINX + Cloudflare Tunnel (on home server)

## Prerequisites

- Node.js 18+ and npm 9+
- Docker & Docker Compose (for Supabase)
- GitHub Account (for OAuth)
- Domain with Cloudflare Tunnel configured to your home server
- Home server with Docker running (same SSH session as deployment)

## Setup

### 1. Clone Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.supabase.example .env.supabase
```

Edit `.env.supabase` with your configuration:

```env
# Database
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-very-long-jwt-secret-at-least-32-chars
ANON_KEY=your-supabase-anon-key
SERVICE_ROLE_KEY=your-supabase-service-role-key

# Domain (update to your domain)
API_EXTERNAL_URL=https://notworthy.vip
SITE_URL=https://notworthy.vip
SUPABASE_PUBLIC_URL=https://notworthy.vip

# GitHub OAuth (required)
ENABLE_GITHUB_SIGNUP=true
GITHUB_CLIENT_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret

# (Optional) Email for password resets
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
# Configure SMTP if you want password reset emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

### 2. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** Portfolio
   - **Homepage URL:** `https://notworthy.vip`
   - **Authorization callback URL:** `https://notworthy.vip/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** into `.env.supabase`

### 3. Deploy Supabase

In the same SSH session on your home server:

```bash
cd /data/portfolio
source .env.supabase
docker-compose up -d
docker-compose ps
```

Monitor logs to ensure everything starts correctly:

```bash
docker-compose logs -f
```

### 4. Apply Database Schema

Once Supabase is running:

```bash
docker exec -it supabase-db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/init-scripts/99-init-schema.sql
```

Or connect via Supabase Studio at [http://localhost:3001](http://localhost:3001) and execute the SQL from `volumes/db/init-schema.sql`

### 5. Configure Frontend Environment

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://notworthy.vip
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_studio
VITE_GITHUB_USER=Hany-hazem
VITE_GITHUB_TOKEN=optional_github_pat_for_pinned_repos
```

### 6. Build & Deploy

```bash
npm install
npm run build
cp -r dist/* /usr/share/nginx/html/
```

Reload NGINX:

```bash
sudo systemctl reload nginx
```

## Usage

### Admin Dashboard Features

**Settings Tab:**
- Change GitHub username to fetch
- Select repository display mode (recent, starred, pinned)
- Limit number of repos shown
- Override your bio with custom text

**Activity Logs Tab:**
- View all fetch events, errors, and settings changes
- Filter by event type
- Timestamps in your local timezone

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Base URL of your Supabase instance |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anonymous key from Supabase Studio |
| `VITE_GITHUB_USER` | No | Default GitHub username (default: `Hany-hazem`) |
| `VITE_GITHUB_TOKEN` | No | GitHub personal access token for pinned repos (GraphQL) |

## Architecture

```
Browser (React) → Cloudflare Tunnel → NGINX → Kong API Gateway
                                         ↓
                                  Docker Compose:
                                  - Auth Service
                                  - PostgreSQL
                                  - REST API (PostgREST)
                                  - Realtime
                                  - Storage
```

## Database Schema

**user_settings table:**
- id, user_id, github_username, repo_filter, max_repos, bio_override, created_at, updated_at

**activity_logs table:**
- id, user_id, event_type, event_data, error_message, created_at

## Development

### Dev Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## File Structure

```
/data/portfolio
├── docker-compose.yml          # Supabase services
├── .env.supabase.example       # Environment template
├── nginx.conf                  # Reverse proxy config
├── src/
│   ├── App.tsx                 # Main app
│   ├── lib/supabase.ts         # Supabase client
│   ├── services/github.ts      # GitHub API + logging
│   └── components/AdminDashboard.tsx
├── volumes/
│   ├── api/kong.yml            # Kong config
│   └── db/init-schema.sql      # Database schema
└── package.json
```

## Troubleshooting

### Supabase won't start
```bash
docker-compose ps
docker-compose logs
```

### NGINX can't reach Kong
```bash
curl http://localhost:8000/
docker-compose logs kong
```

### Database schema not applying
Connect via Supabase Studio at [http://localhost:3001](http://localhost:3001) and manually execute the SQL

## Support

For issues, check logs:
```bash
docker-compose logs -f
```

---

**Last Updated:** January 2026  
**GitHub Synced Portfolio - Self-Hosted Edition**