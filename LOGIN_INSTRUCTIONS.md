# Localhost Login Instructions

## Quick Start

### Step 1: Open the Login Page
**URL**: http://localhost:3000/login

### Step 2: Login Credentials
- **Email**: `admin@uabindia.in`
- **Password**: `Admin@123`

### Step 3: Click "Sign in"

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   Port 3000     │◄───────►│   Port 5000     │
│   (Next.js)     │  API    │   (.NET 8)      │
└─────────────────┘  Proxy  └─────────────────┘
                        │
                        ▼
              ┌───────────────────────┐
              │  /api/v1/* Path       │
              │  Rewritten to         │
              │  localhost:5000       │
              └───────────────────────┘
```

## How It Works

1. **Frontend runs on port 3000** - User accesses http://localhost:3000/login
2. **Backend runs on port 5000** - All API requests go here
3. **Next.js proxy** - `/api/v1/*` routes are automatically forwarded to localhost:5000
4. **Database** - SQL Server holds user credentials

## Default Admin User

The admin user is auto-created on first startup:
- **Email**: `admin@uabindia.in`
- **Password**: `Admin@123`
- **Tenant**: `api`
- **Role**: SuperAdmin

## Troubleshooting

### If you see "Unable to connect to server"

1. Check backend is running:
   - Open http://localhost:5000/health
   - Should return: `{"status":"Healthy"}`

2. If not running, start backend:
   ```bash
   cd Backend\src\UabIndia.Api
   dotnet run
   ```

### If you see "Invalid credentials"

1. Check database exists:
   - The database `UabIndia_HRMS` should be created on first startup
   - Check backend logs for: "Database migrations applied successfully"

2. Check admin user exists:
   - Backend logs should show: "SuperAdmin created: admin@uabindia.in"

3. Restart backend to reseed:
   ```bash
   # Stop backend (Ctrl+C), then:
   cd Backend\src\UabIndia.Api
   dotnet run
   ```

### If you see CORS errors

The CORS is configured to allow all localhost origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- `http://127.0.0.1:5173`

### If page shows "Page not found"

1. Make sure frontend is running:
   ```bash
   cd Frontend
   npm run dev
   ```

2. Open http://localhost:3001 if port 3000 is in use

## Backend Health Check

Open in browser: http://localhost:5000/health

Expected response:
```json
{
  "status": "Healthy",
  "checks": [...]
}
```

## Frontend Status

The frontend should show:
- Local: http://localhost:3000 (or 3001)
- Next.js 16.1.6 (Turbopack)

## Current Running Services

| Service | Port | Status |
|---------|------|--------|
| Backend | 5000 | Running |
| Frontend | 3000/3001 | Running |

## Login Flow

1. User visits http://localhost:3000/login
2. Frontend fetches CSRF token from `/api/v1/auth/csrf-token`
3. User submits email/password
4. Frontend POSTs to `/api/v1/auth/login`
5. Next.js proxy forwards to http://localhost:5000/api/v1/auth/login
6. Backend validates credentials
7. If valid, sets httpOnly cookies (access_token, refresh_token)
8. Returns success response
9. Frontend redirects to dashboard

## Database Configuration

**Connection String**: 
```
Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true
```

**JWT Configuration**:
- Key: `dev-only-change-this-to-a-strong-secret-key-min-32-chars`
- Issuer: `UabIndia`
- Audience: `UabIndiaUsers`

## Files Modified

1. `Frontend/src/lib/server-api-base-url.ts` - Fixed localhost fallback
2. `Frontend/.env.local` - Updated API URL to use localhost
3. `Backend/src/UabIndia.Api/appsettings.Development.json` - Fixed JWT config
4. `.env` - Updated JWT key and CORS origins

## Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal for logs
3. Check `Frontend/dev-server.log` for frontend issues
4. Review this guide for common issues
