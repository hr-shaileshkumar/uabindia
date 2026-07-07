#!/bin/bash

# ERP Frontend Dev Run Script
# Starts Next.js directly in dev mode so local startup stays fast.

set -e

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo
echo "Entering frontend directory..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci --legacy-peer-deps
fi

echo
echo "Starting Next.js dev server..."
echo "Frontend will be available at:"
echo "  - http://localhost:3000"
echo

npm run dev
