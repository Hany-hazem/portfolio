#!/bin/bash
# Quick setup script for self-hosted portfolio

set -e

echo "🚀 Portfolio Setup Script"
echo "========================"
echo ""

# Check if .env.supabase exists
if [ ! -f .env.supabase ]; then
    echo "📋 Creating .env.supabase from template..."
    cp .env.supabase.example .env.supabase
    echo "⚠️  Please edit .env.supabase with your configuration before proceeding"
    echo "   Required: GITHUB_CLIENT_ID, GITHUB_SECRET, POSTGRES_PASSWORD, JWT_SECRET"
    exit 1
fi

echo "✅ .env.supabase found"
echo ""

# Load environment
source .env.supabase

echo "🐳 Starting Supabase services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy (this may take 2-3 minutes)..."
sleep 10

# Check if services are running
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo -n "."
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo ""
        echo "✅ PostgreSQL is ready"
        break
    fi
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo ""
    echo "❌ PostgreSQL failed to start after 2.5 minutes"
    echo "Check logs: docker-compose logs db"
    exit 1
fi

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create GitHub OAuth App at https://github.com/settings/developers"
echo "   - Callback URL: https://notworthy.vip/auth/v1/callback"
echo "2. Add credentials to .env.supabase (GITHUB_CLIENT_ID, GITHUB_SECRET)"
echo "3. Apply database schema via Supabase Studio:"
echo "   - Visit http://localhost:3001"
echo "   - Copy-paste contents of volumes/db/init-schema.sql into SQL Editor"
echo "4. Create .env.local with frontend config"
echo "5. Run: npm install && npm run build"
echo "6. Copy dist/* to /usr/share/nginx/html/"
echo ""
echo "📖 Full setup guide: https://github.com/your-repo/README.md"
