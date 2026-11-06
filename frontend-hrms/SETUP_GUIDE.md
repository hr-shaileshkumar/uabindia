# Frontend Admin Dashboard Setup Guide

Complete setup guide for the React.js Admin Dashboard.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running and accessible

---

## Step 1: Install Dependencies

```bash
cd Frontend
npm install
```

---

## Step 2: Configure API URL

### Option 1: Update Vite Config (Recommended for Development)

Open `vite.config.js` and update the proxy:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend API URL
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### Option 2: Create Environment File

Create `.env` file in `Frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then update `src/main.jsx` or create an API config file to use this variable.

---

## Step 3: Run Development Server

```bash
npm run dev
```

Application will be available at: `http://localhost:3000`

---

## Step 4: Test Login

1. Open `http://localhost:3000`
2. You should be redirected to login page
3. Enter mobile number: `9999999999` (default admin)
4. Click "Generate OTP"
5. Check backend logs/console for OTP code
6. Enter OTP and login

---

## Step 5: Production Build

### 5.1 Build for Production

```bash
npm run build
```

This creates an optimized build in `dist/` directory.

### 5.2 Update API URL for Production

Before building, update API URL:

**Option 1: Environment Variable**

Create `.env.production`:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

**Option 2: Update Code**

Update API calls in components to use production URL.

### 5.3 Deploy

**Deploy to Netlify:**
1. Build the project: `npm run build`
2. Drag and drop `dist/` folder to Netlify
3. Configure redirects (see below)

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

**Deploy to Any Static Host:**
- Upload `dist/` folder contents
- Configure server to serve `index.html` for all routes

### 5.4 Configure Redirects (SPA)

Create `public/_redirects` (for Netlify) or `.htaccess` (for Apache):

```
/*    /index.html   200
```

This ensures React Router works correctly.

---

## Configuration Options

### Update API Base URL

If your API is on a different domain:

1. **Development:** Update `vite.config.js` proxy
2. **Production:** Update environment variable or API config

### Customize Theme

Edit `tailwind.config.js` to customize colors and styling.

---

## Troubleshooting

### Issue: Cannot connect to API

**Solution:**
- Verify backend is running
- Check API URL in configuration
- Check CORS settings in backend
- Check browser console for errors

### Issue: Login fails

**Solution:**
- Verify backend API is accessible
- Check network tab in browser DevTools
- Verify OTP is being generated
- Check backend logs

### Issue: Blank page after build

**Solution:**
- Ensure redirects are configured (SPA routing)
- Check browser console for errors
- Verify all assets are loading correctly

---

## Security Notes

- API calls include JWT token in Authorization header
- Token stored in localStorage (consider httpOnly cookies for production)
- HTTPS required in production
- Update CORS settings in backend for production domain

---

## Next Steps

1. Configure production API URL
2. Test all features
3. Set up monitoring
4. Configure custom domain (if needed)
