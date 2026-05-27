# ========== DEPLOYMENT & ISSUES FIX GUIDE ==========

## CRITICAL FIXES APPLIED ✅

### 1. Vercel Build Configuration (FIXED)

**Problem**: 
- Error: "No Next.js version detected"
- Build was looking in `frontend-next` directory instead of `frontend`

**Solution Applied**:
- ✅ Updated `vercel.json` to use relative paths (no `cd frontend` prefix)
- ✅ Created `.vercelignore` to exclude unnecessary files
- ✅ Configured Vercel to build from root directory

**What You Need to Do in Vercel Dashboard**:
1. Go to https://vercel.com/dashboard
2. Select your "uabindia" project
3. Navigate to Settings → General
4. Ensure **Root Directory** is set to: `.` (root/current directory)
5. **Do NOT set it to "frontend" or "frontend-next"**
6. Redeploy your project

---

### 2. Frontend Dependencies (VERIFIED)

**Status**: ✅ Next.js is properly installed

Your `frontend/package.json` contains:
```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

**No action needed** - dependencies are correct!

---

### 3. Backend Configuration (VERIFIED)

**Status**: ✅ Backend is configured

Configuration files:
- `Backend/src/UabIndia.Api/appsettings.Development.json` - Development setup
- `Backend/src/UabIndia.Api/appsettings.json` - Production template

**Note**: You need to provide your own secrets for production:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your-SQL-Server-Connection-String"
  },
  "Jwt": {
    "Key": "Your-64-character-secret-key"
  },
  "Encryption": {
    "Key": "Your-encryption-key"
  }
}
```

---

## LOCAL SETUP & TESTING

### Quick Start (Windows)

```powershell
# Run setup script
.\setup.ps1 -Component both -Clean -Build -Run

# Or run individually:
# Backend
.\run-backend.bat

# Frontend (in separate terminal)
cd frontend
npm run dev
```

### Quick Start (Mac/Linux)

```bash
# Backend
./run-backend.sh

# Frontend (in separate terminal)
./run-frontend.sh
```

---

## DEPLOYMENT VERIFICATION

### For Vercel (Frontend) Deployment:

```bash
# Test locally
cd frontend
npm ci --legacy-peer-deps
npm run build
npm run start

# Check the build is successful
# You should see "Ready started server on" message
```

### For Backend API (if deploying to Azure/AWS):

```bash
# Build Docker image
docker build -f Backend/Dockerfile -t uabindia-api:latest .

# Or build for deployment
cd Backend/src/UabIndia.Api
dotnet publish -c Release -o ./publish
```

---

## ENVIRONMENT VARIABLES

### Frontend (.env.local or Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://your-api.com/api/v1
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Backend (appsettings.Production.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your-Production-SQL-Connection"
  },
  "Jwt": {
    "Key": "Your-Production-Key",
    "Issuer": "UabIndia",
    "Audience": "UabIndiaUsers"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend-domain.com"
    ]
  }
}
```

---

## TROUBLESHOOTING

### Problem: "No Next.js version detected"
**Solution**: 
1. Verify Root Directory in Vercel is `.` not `frontend-next`
2. Ensure `vercel.json` exists and is configured correctly
3. Run `npm ci` in `frontend` folder to reinstall dependencies

### Problem: Backend API not running
**Solution**:
1. Ensure SQL Server is running and accessible
2. Check connection string in `appsettings.Development.json`
3. Run: `dotnet restore && dotnet build && dotnet run`

### Problem: Port already in use
**Solution**:
- Backend: Change port in `Backend/src/UabIndia.Api/Program.cs` or kill process on 5000
- Frontend: Change port with `npm run dev -- -p 3001`

---

## FILES CREATED/UPDATED

✅ `vercel.json` - Updated build configuration
✅ `.vercelignore` - Created to exclude unnecessary files
✅ `setup.ps1` - Comprehensive PowerShell setup script
✅ `run-backend.sh` - Backend startup script (Linux/Mac)
✅ `run-backend.bat` - Backend startup script (Windows)
✅ `run-frontend.sh` - Frontend startup script (Linux/Mac)

---

## NEXT STEPS

1. **Immediate Action**: Update Vercel project Root Directory setting to `.`
2. **Test Locally**: Run `.\setup.ps1 -Component both -Build -Run`
3. **Verify Build**: Check that both backend and frontend start without errors
4. **Redeploy**: Push changes and trigger a new Vercel deployment

---

## SUPPORT RESOURCES

- Next.js Docs: https://nextjs.org/docs
- Vercel Deploy: https://vercel.com/docs
- .NET 8 Docs: https://learn.microsoft.com/en-us/dotnet/
- SQL Server Connection: https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/connection-strings

