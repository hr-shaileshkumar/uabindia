#!/bin/bash

# ERP Frontend Build and Run Script
# Requires: Node.js 18+, npm or yarn

set -e

echo "=========================================="
echo "ERP Frontend - Build and Run"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

echo ""
echo "📂 Entering frontend directory..."
cd frontend

echo "📦 Step 1: Installing dependencies..."
npm ci --legacy-peer-deps

echo "✅ Verifying Next.js installation..."
npm list next

echo ""
echo "🔨 Step 2: Building Next.js application..."
npm run build

echo ""
echo "🚀 Step 3: Starting Next.js development server..."
echo ""
echo "Frontend will be available at:"
echo "   - http://localhost:3000"
echo ""

npm run dev
