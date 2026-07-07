#!/bin/bash

# ERP Backend Dev Run Script
# Uses dotnet watch so local startup stays incremental.

set -e

if ! command -v dotnet &> /dev/null; then
    echo "ERROR: dotnet CLI is not installed or not in PATH"
    echo "Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download"
    exit 1
fi

echo "Checking .NET version..."
dotnet --version

echo
echo "Checking for an existing backend process..."
if pgrep -f "UabIndia.Api" > /dev/null; then
    echo "Stopping existing UabIndia.Api process..."
    pkill -f "UabIndia.Api" || true
    sleep 2
else
    echo "No existing backend process found."
fi

echo
echo "Starting backend API in watch mode..."
echo "API will be available at:"
echo "  - http://localhost:5000"
echo "  - https://localhost:5001"
echo

dotnet watch run --project Backend/src/UabIndia.Api/UabIndia.Api.csproj
