#!/bin/bash

# UabIndia ERP Backend Deployment Script
# Run this on your server at 152.59.146.98

echo "🚀 Starting UabIndia ERP Backend Deployment..."

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET is not installed. Please install .NET 8 runtime first."
    exit 1
fi

echo "✅ .NET found: $(dotnet --version)"

# Set environment variables (update these with your actual values)
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Server=your_sql_server;Database=UabIndia_HRMS;User Id=your_username;Password=your_password;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=true"
export Jwt__Key="your-secure-jwt-key-minimum-64-characters-long-here"
export Jwt__Issuer="https://api.uabindia.in"
export Jwt__Audience="uabindia_clients"
export Encryption__Key="your-encryption-key-32-characters-here"

echo "🔧 Environment variables set"

# Navigate to the API directory
cd Backend/src/UabIndia.Api || {
    echo "❌ Cannot find Backend/src/UabIndia.Api directory"
    exit 1
}

echo "📁 In directory: $(pwd)"

# Build the application
echo "🔨 Building application..."
dotnet build --configuration Release

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Run the application
echo "🚀 Starting application on port 80..."
dotnet run --configuration Release --urls "http://0.0.0.0:80" &

# Wait a moment
sleep 5

# Check if it's running
if pgrep -f "dotnet.*UabIndia.Api" > /dev/null; then
    echo "✅ Application started successfully!"
    echo "🌐 Should be accessible at: https://api.uabindia.in"
    echo "🔍 Check health: https://api.uabindia.in/health/live"
else
    echo "❌ Application failed to start"
    exit 1
fi

echo "📋 Process ID: $(pgrep -f "dotnet.*UabIndia.Api")"
echo "💡 To stop: kill $(pgrep -f "dotnet.*UabIndia.Api")"
echo "💡 To restart: run this script again"