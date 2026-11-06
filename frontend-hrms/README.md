# Uabindia HRMS - Enterprise Web Dashboard

React.js admin dashboard for managing farmer feedback and treatment records.

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API URL**
   - Update proxy in `vite.config.js` if needed
   - Or update axios base URL in components

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   Application will be available at: `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
Frontend/
├── src/
│   ├── components/      # Reusable Components
│   ├── pages/           # Page Components
│   ├── context/         # React Context (Auth)
│   └── App.jsx          # Main App Component
├── public/              # Static Assets
└── package.json         # Dependencies
```

## Features

- **Authentication**: Mobile number + OTP login
- **Dashboard**: Statistics and overview
- **Treatments**: View, filter, and export treatment records
- **Farmers**: View and filter farmers
- **Reports**: Export to Excel functionality

## Configuration

### API Configuration

Update `vite.config.js` proxy settings:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

## Development

- Uses Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- SweetAlert2 for alerts

## Production Build

```bash
npm run build
```

Output will be in `dist/` directory. Deploy to any static hosting service.
