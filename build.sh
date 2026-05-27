#!/bin/bash

# Vercel Build Script for ERP Frontend + Backend
# This script ensures dependencies are installed and builds are correct

set -e

echo "🚀 Starting Vercel Build Process..."
echo "📁 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

# Ensure we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found in current directory"
  echo "📍 Available directories:"
  ls -la /
  exit 1
fi

echo "✅ Found package.json"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps 2>&1 | tee npm-install.log

# Check if Next.js is installed
if npm list next > /dev/null 2>&1; then
  echo "✅ Next.js is installed"
  npm list next
else
  echo "❌ Error: Next.js is not installed"
  echo "Installing Next.js..."
  npm install next@16.1.6 --save
fi

# Build the frontend
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
