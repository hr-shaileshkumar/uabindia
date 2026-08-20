#!/bin/bash

# Vercel / CI build for the Next.js frontend
set -e

echo "Starting frontend build..."
echo "Current directory: $(pwd)"

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Building from frontend/"
  npm --prefix frontend ci --legacy-peer-deps
  npm --prefix frontend run build
elif [ -f "package.json" ]; then
  echo "Building from current directory"
  npm ci --legacy-peer-deps
  npm run build
else
  echo "Error: frontend/package.json not found"
  exit 1
fi

echo "Build completed successfully!"
