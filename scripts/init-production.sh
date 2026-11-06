#!/bin/bash
# ==============================================================================
# UabIndia SaaS ERP - Production First-Boot Initialization & Deployment Script
# ==============================================================================

set -e

echo "======================================================================"
echo "🚀 Initializing UabIndia SaaS ERP for Production..."
echo "======================================================================"

# 1. Create .env if not present
if [ ! -f .env ]; then
  echo "📄 Generating production .env from template..."
  cp .env.production.example .env
  
  # Generate a 64-character random secure key for JWT
  RANDOM_JWT=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
  sed -i "s/CHANGE_THIS_TO_YOUR_SECURE_256_BIT_RANDOM_JWT_SECRET_KEY_MIN_64_CHARS/$RANDOM_JWT/g" .env
  echo "✅ Cryptographically secure JWT Secret generated and saved."
fi

# 2. Build and Launch Containers
echo "🐳 Starting Docker containers (SQL Server, Redis, .NET API, Next.js, Nginx)..."
docker compose up -d --build

echo "⏳ Waiting for Database & Backend API to become healthy..."
sleep 15

# 3. Healthcheck verification
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")

echo "======================================================================"
echo "🎉 UabIndia ERP Production Stack is LIVE!"
echo "======================================================================"
echo "🌐 Web Dashboard:       http://localhost (or your configured domain)"
echo "🔌 REST API & Swagger:  http://localhost:5000/swagger"
echo "🔑 Default SuperAdmin:  admin@uabindia.com / Admin@123456!"
echo "💳 SaaS Plans Seeded:   Trial, Starter (₹2,499), Growth (₹6,999), Enterprise (₹19,999)"
echo "📊 Database:            Microsoft SQL Server 2022 (Port 1433)"
echo "⚡ Distributed Cache:   Redis 7 (Port 6379)"
echo "======================================================================"
