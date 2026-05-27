# ERP Frontend - Architecture & Implementation Guide

## Overview

This is an enterprise-grade ERP frontend built with Next.js App Router, implementing a **backend-authoritative, UI-only** architecture pattern. The frontend renders what the backend allows—no authorization, module access, or business logic resides in the frontend.

## Architecture Principles

### 1. Backend-Authoritative Pattern
- **Authentication & Authorization**: Backend issues JWT access tokens and manages refresh tokens via HTTP-only cookies
- **Module Management**: `/api/v1/modules/enabled` returns the exact modules available to the user
- **Company/Project Context**: Dropdown selections come from backend APIs
- **Page Access**: Only modules returned by backend are rendered in sidebar
- **Permissions**: All permission checks happen server-side; frontend respects backend responses

### 2. Unified API Client
All API communication flows through a single, typed API client (`src/lib/hrApi.ts`) with:
- Request/response interceptors for token management
- Automatic 401 handling with redirect to login
- TypeScript interfaces for all data structures
- Centralized error handling

### 3. UI-Only Frontend
The frontend is responsible for:
- Rendering modules/pages from backend payload
- Managing local UI state (dropdowns, modals, pagination)
- Navigation and routing
- Global search functionality
- Layout composition (topbar, sidebar, content)

---

## File Structure

```
frontend-next/src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx           # Unauthenticated login page
│   ├── (protected)/
│   │   ├── layout.tsx               # Main app shell (topbar + sidebar + content)
│   │   └── app/hrms/
│   │       ├── page.tsx             # Dashboard
│   │       ├── employees/page.tsx   # Employee master
│   │       ├── attendance/page.tsx  # Attendance tracking
│   │       ├── leave/page.tsx       # Leave management
│   │       └── payroll/page.tsx     # Payroll management
│   ├── page.tsx                     # Root redirect
│   └── providers.tsx                # Global providers (AuthProvider)
├── components/
│   ├── Topbar.tsx                   # Global header with search, company, refresh
│   ├── Sidebar.tsx                  # Dynamic module navigation
│   └── GlobalSearch.tsx             # Global search with keyboard shortcuts
├── context/
│   └── AuthContext.tsx              # Auth state management
├── lib/
│   ├── apiClient.ts                 # Axios instance with interceptors
│   └── hrApi.ts                     # Typed API endpoints
├── types/
│   └── index.ts                     # Domain types (User, Module, Company, etc.)
└── [other assets, styles, etc.]
```

---

## Core Components

### Topbar (`src/components/Topbar.tsx`)
**Purpose**: Global header with context switching and user management

**Features**:
- Logo + app version (from backend)
- Global search with keyboard shortcuts (press `/` to focus)
- Company dropdown (backend-driven, fetched from `/api/v1/companies`)
- Project dropdown (depends on selected company, fetched from `/api/v1/projects?companyId=X`)
- Refresh button (re-fetches `/auth/me` and `/modules/enabled`)
- User profile menu with logout

**Props**:
```typescript
interface TopbarProps {
  user: User;
  modules: Module[];
  appVersion?: string;
  onRefresh?: () => void;
  onLogout?: () => void;
}
```

### Sidebar (`src/components/Sidebar.tsx`)
**Purpose**: Dynamic module navigation generated from backend

**Features**:
- Renders modules from `GET /api/v1/modules/enabled`
- Expandable modules showing sub-modules/pages
- Active state highlighting based on current pathname
- Loading skeleton during fetch
- No hardcoded menu items

**Data Structure**:
```typescript
interface Module {
  key: string;           // "hrms", "crm", "inventory"
  name: string;          // "HRMS", "CRM", "Inventory"
  isEnabled: boolean;
  subModules?: SubModule[];
}

interface SubModule {
  key: string;
  name: string;
  path: string;          // "/app/hrms/employees"
  icon?: string;
}
```

### GlobalSearch (`src/components/GlobalSearch.tsx`)
**Purpose**: Global search for modules and pages

**Features**:
- Real-time search across all enabled modules and sub-modules
- Keyboard navigation (arrow keys, enter, escape)
- `/` shortcut to focus search box
- Shows available modules when empty
- Direct navigation on selection
- No backend API call needed (uses local module index)

---

## API Client (`src/lib/hrApi.ts`)

Unified, typed API client organized by domain:

```typescript
export const hrApi = {
  auth: {
    login: (email, password, deviceId) => Promise<AuthResponse>
    me: () => Promise<{ user: User }>
    logout: () => Promise<void>
    refreshToken: () => Promise<AuthResponse>
  },
  modules: {
    getEnabled: () => Promise<ModulesResponse>
  },
  company: {
    getAll: () => Promise<CompaniesResponse>
    getById: (id) => Promise<{ company: Company }>
  },
  project: {
    getByCompany: (companyId) => Promise<ProjectsResponse>
    getById: (id) => Promise<{ project: Project }>
  },
  system: {
    getVersion: () => Promise<AppVersion>
    getAppInfo: () => Promise<{ version, buildDate }>
  },
  search: {
    query: (q) => Promise<{ results: SearchResult[] }>
  },
  dashboard: {
    getStats: () => Promise<DashboardStats>
  },
  hrms: {
    employees: { list, getById, create, update }
    attendance: { list, getById, markAttendance }
    leave: { list, getById, requestLeave, approveLeave }
    payroll: { list, getById }
  }
};
```

### Request/Response Interceptors

**Request**:
- Attaches `Authorization: Bearer <token>` header if token exists in localStorage
- Preserves `withCredentials: true` for HTTP-only cookie refresh tokens

**Response**:
- On 401: Clears token and redirects to `/login`
- All other errors pass through for component-level handling

---

## App Shell Layout (`src/app/(protected)/layout.tsx`)

**Structure**:
```
┌─────────────────────────────────────────┐
│           Topbar (64px)                 │
│ Logo | Search | Company | Project | User│
├──────────────┬───────────────────────────┤
│              │                           │
│  Sidebar     │     Content Area          │
│  (264px)     │   (flex-1: responsive)    │
│              │                           │
│              │                           │
└──────────────┴───────────────────────────┘
```

**Key Features**:
1. **Single source of truth**: Layout fetches modules once and passes to child components
2. **Refresh trigger**: `refreshKey` state re-triggers module fetch without browser reload
3. **Loading states**: Both topbar and sidebar show loading indicators during fetch
4. **Authorization**: If user not loaded, redirects to `/login`
5. **Modular sub-routes**: All HRMS pages (`employees`, `attendance`, etc.) are independent components

---

## Authentication Flow

### Login Flow
```
1. User enters email/password on /login
2. POST /api/v1/auth/login { email, password, deviceId }
3. Backend returns: { accessToken, refreshToken, expiresIn }
4. Frontend calls setAccessToken(accessToken) → stores in localStorage
5. Frontend redirects to /app/hrms
6. AuthContext fetches /api/v1/auth/me using token
7. Sets user state and renders protected layout
```

### Token Management
```
Access Token:     JWT (15 min TTL) stored in localStorage
Refresh Token:    HTTP-only cookie (30 days TTL), auto-handled by browser
Request Flow:     accessToken attached to Authorization header via interceptor
Expiry Handling:  On 401 response, clear token and redirect to /login
```

### Refresh Token Rotation
```
When token expires:
1. Browser includes HTTP-only refresh token cookie in request
2. Backend receives 401 with invalid access token
3. Interceptor clears localStorage token
4. User redirected to /login
5. On next login, fresh access token issued
```

---

## HRMS Modules

### Dashboard (`/app/hrms`)
- Displays KPI stats via `GET /api/v1/dashboard/stats`
- Shows: total employees, active, on leave, new joiners, pending approvals

### Employee Master (`/app/hrms/employees`)
- Lists employees via `GET /api/v1/hrms/employees?page=1&limit=10`
- Table with: name, email, role, status
- Action buttons for viewing employee details

### Attendance (`/app/hrms/attendance`)
- Lists attendance records via `GET /api/v1/hrms/attendance?page=1&limit=10`
- Table with: date, employee, status, check-in, check-out
- Mark attendance button

### Leave (`/app/hrms/leave`)
- Lists leave requests via `GET /api/v1/hrms/leave?page=1&limit=10`
- Table with: employee, leave type, dates, status
- Approve/reject actions for pending leaves

### Payroll (`/app/hrms/payroll`)
- Lists payroll records via `GET /api/v1/hrms/payroll?page=1&limit=10`
- Table with: employee, month, salary, earnings, deductions, net, status
- Process payroll button

---

## Module Extension Pattern

To add a new module (e.g., CRM):

### 1. Backend: Register Module
```sql
INSERT INTO Modules (ModuleKey, Name, IsEnabled)
VALUES ('crm', 'CRM', 1);
```

### 2. Backend: Enable for Tenant
```sql
INSERT INTO TenantModules (TenantId, ModuleKey, IsEnabled)
VALUES (1, 'crm', 1);
```

### 3. Frontend: Create Routes
```
src/app/(protected)/app/crm/
├── page.tsx              # CRM Dashboard
├── leads/page.tsx        # Leads list
├── contacts/page.tsx     # Contacts list
└── deals/page.tsx        # Deals pipeline
```

### 4. Frontend: Add API Endpoints
```typescript
// src/lib/hrApi.ts
crm: {
  leads: { list, getById, create, update },
  contacts: { list, getById, create, update },
  deals: { list, getById, create, update }
}
```

### 5. Sidebar Auto-Updates
- No code changes needed
- Backend returns new module in `/modules/enabled`
- Sidebar dynamically renders CRM module with its sub-pages

---

## Development Checklist

### Before Launch
- [ ] Backend returns valid JWT tokens
- [ ] Backend has `/auth/me`, `/modules/enabled`, `/companies`, `/projects` endpoints
- [ ] All module APIs return proper response shapes matching `types/index.ts`
- [ ] CORS is configured for frontend URL
- [ ] Refresh token rotation works (HTTP-only cookies set)
- [ ] App version is accessible via `/system/version` or similar

### Testing the Flow
1. Login with valid credentials → Should redirect to `/app/hrms`
2. Click company dropdown → Should list companies from backend
3. Select company → Projects dropdown populates
4. Click refresh button → Should re-fetch user and modules
5. Click global search, type "/" → Should show search box
6. Search for "employees" → Should suggest `/app/hrms/employees`
7. Click logout → Should clear token and redirect to `/login`

### Debugging
- **No modules showing**: Check `/api/v1/modules/enabled` response shape
- **401 on protected routes**: Verify token is in Authorization header (check Network tab)
- **Topbar dropdowns empty**: Check `/api/v1/companies` and `/api/v1/projects` responses
- **Search not working**: Verify modules have `subModules` array with `path` field

---

## Security Notes

1. **JWT in localStorage**: Acceptable for this frontend-only pattern; backend is authoritative
2. **HTTP-only Cookies**: Refresh tokens stored here for security (XSS-proof)
3. **CORS**: Ensure frontend domain is in backend CORS whitelist
4. **withCredentials**: Enabled to send cookies with cross-origin requests
5. **No Client-Side Authorization**: All permission checks happen server-side

---

## Quality Standards Met

✅ **Multi-company, multi-project** support via backend dropdowns  
✅ **Module-based licensing** (only enabled modules render)  
✅ **Zero hardcoded menus** (all from backend)  
✅ **ERP-grade routing** (`/app/<module>/<page>`)  
✅ **Future-proof** (CRM, Inventory plug in without UI changes)  
✅ **Enterprise authentication** (JWT + refresh tokens)  
✅ **Backend-authoritative** (all business logic server-side)  
✅ **Type-safe API** (TypeScript interfaces for all endpoints)  
✅ **Scalable architecture** (single app shell, modular pages)  

---

## File Manifest

**Components**:
- `Topbar.tsx`: Global header with context + search
- `Sidebar.tsx`: Dynamic module navigation
- `GlobalSearch.tsx`: Global search with keyboard shortcuts

**API & State**:
- `lib/apiClient.ts`: Axios with interceptors
- `lib/hrApi.ts`: Typed API endpoints
- `context/AuthContext.tsx`: Auth state + token management
- `types/index.ts`: Domain types (User, Module, Company, etc.)

**Pages**:
- `app/(auth)/login/page.tsx`: Login page
- `app/(protected)/layout.tsx`: App shell (topbar + sidebar)
- `app/(protected)/app/hrms/page.tsx`: Dashboard
- `app/(protected)/app/hrms/{employees,attendance,leave,payroll}/page.tsx`: HRMS modules

**Config**:
- `next.config.ts`: API rewrites, redirects
- `src/app/providers.tsx`: AuthProvider wrapper

---

## Next Steps

1. **Verify Backend APIs**: Ensure all endpoints match this architecture
2. **Test End-to-End**: Login → modules load → navigate modules → refresh → logout
3. **Add CRM/Inventory**: Repeat module extension pattern
4. **Implement Permissioning**: Add permission checks from backend user object
5. **Add Analytics**: Track module usage, page views
6. **Production Deploy**: Set proper CORS, API domain, env variables
