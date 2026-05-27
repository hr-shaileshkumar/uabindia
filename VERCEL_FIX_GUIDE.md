# VERCEL DEPLOYMENT CONFIGURATION - CRITICAL FIX

## ROOT CAUSE ANALYSIS

Your Vercel deployment was failing because:

```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

This error occurred because **Vercel's Root Directory setting was pointing to `frontend-next`** instead of `frontend`, but:
- `frontend-next` directory doesn't exist (it was archived)
- The actual Next.js app is in the `frontend` directory
- When Vercel tried to run the build in `frontend-next`, it couldn't find package.json or Next.js

## SOLUTION APPLIED ✅

### 1. Updated `vercel.json`

**Before:**
```json
{
  "buildCommand": "cd frontend && npm run build",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm ci",
  "outputDirectory": "frontend/.next"
}
```

**After:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Why**: When Root Directory is set correctly in Vercel, commands should NOT include `cd frontend` because Vercel will already execute from that directory.

### 2. Created `.vercelignore`

This file tells Vercel which files/folders to exclude from deployment, reducing build time and bundle size:
- `node_modules` - dependencies are reinstalled
- `Backend/` - not needed for frontend deployment
- `docs/`, `Documentation/` - not needed
- `*.md` - documentation files
- `.git/`, `.github/` - version control files

## ACTION ITEMS - MUST DO

### Step 1: Update Vercel Project Settings

1. Go to https://vercel.com/dashboard
2. Select your **uabindia** project
3. Click **Settings**
4. Go to **General**
5. Find **Root Directory** setting
6. **Change it from `frontend-next` to `.` (current/root directory)**
7. Click **Save**

**Screenshot Guide:**
```
Dashboard > uabindia > Settings > General > Root Directory
Change from: frontend-next
Change to: .
```

### Step 2: Verify Other Settings

In the same Settings page, ensure:
- **Framework Preset**: `Next.js` ✓
- **Build Command**: Leave empty (uses vercel.json)
- **Output Directory**: Leave empty (uses vercel.json)
- **Install Command**: Leave empty (uses vercel.json)

### Step 3: Redeploy

Option A - Via Dashboard:
1. Go to **Deployments**
2. Click the three dots on latest failed deployment
3. Select **Redeploy**

Option B - Via Git:
```bash
git add .
git commit -m "fix: vercel deployment configuration"
git push origin main
```

---

## VERIFICATION CHECKLIST

After making changes, verify by checking Vercel deployment logs:

✅ Check that build runs from root directory
```
Running "install" command: `npm ci`
(NOT: `cd frontend && npm ci`)
```

✅ Check that Next.js is found
```
✓ Found next version 16.1.6
```

✅ Check that build succeeds
```
✓ Build succeeded at 22:45:30
```

---

## ENVIRONMENT VARIABLES (Vercel Dashboard)

If you need to set environment variables in Vercel (for frontend):

1. Go to **Settings > Environment Variables**
2. Add these variables:

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-api-domain.com/api/v1
(For production - use your actual backend URL)

Name: NEXT_PUBLIC_APP_VERSION
Value: 1.0.0
```

⚠️ **Important**: Variables starting with `NEXT_PUBLIC_` are visible in browser (safe for public values)

---

## TROUBLESHOOTING

### Issue: Still getting "No Next.js version detected"

**Solution**:
1. Verify Root Directory is actually set to `.` in Vercel UI (refresh page)
2. Wait 5 minutes for setting to propagate
3. Try redeploying
4. Check if `.vercelignore` is causing issues - temporarily delete it
5. Contact Vercel support with deployment URL if issue persists

### Issue: Build times are slow

**Solution**:
- `.vercelignore` is already optimized
- Check if large files are in root directory
- Ensure you're not deploying Docker files or Backend code

### Issue: Frontend can't reach Backend API

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` environment variable
2. Verify Backend API is running and accessible
3. Check CORS settings in Backend `appsettings.Production.json`
4. Ensure frontend and backend are on same domain or CORS is enabled

---

## FILE CHANGES SUMMARY

| File | Change | Reason |
|------|--------|--------|
| `vercel.json` | Removed `cd frontend` from commands | Root Directory setting handles navigation |
| `.vercelignore` | Created | Optimize deployment bundle |
| `.env` | Updated with detailed comments | Better configuration management |
| `DEPLOYMENT_FIX_GUIDE.md` | Created | Comprehensive deployment guide |
| `setup.ps1` | Created | Automated local setup |
| `run-backend.bat/sh` | Created | Easy backend startup |
| `run-frontend.sh` | Created | Easy frontend startup |

---

## NEXT: BACKEND DEPLOYMENT (If needed)

If you need to deploy the Backend API separately:

1. **Docker Deployment**:
   - Backend has `Dockerfile` in root
   - Use: `docker build -f Backend/Dockerfile -t uabindia-api:latest .`

2. **Azure App Service**:
   - Publish: `dotnet publish -c Release -o ./publish`
   - Deploy from `Backend/src/UabIndia.Api/publish`

3. **IIS / On-Premises**:
   - Windows hosting: `dotnet publish -c Release -o ./iis-deploy`
   - Host the `publish` folder

---

## SUPPORT

For more information:
- Vercel Docs: https://vercel.com/docs/deployments/overview
- Next.js Docs: https://nextjs.org/docs
- Environment Variables: https://vercel.com/docs/projects/environment-variables
