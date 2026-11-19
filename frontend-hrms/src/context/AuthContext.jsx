import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient, {
  getStoredToken,
  setStoredToken,
  getStoredTenant,
  setStoredTenant,
  setStoredCompanyId,
} from "../api/client";

export const DEMO_PERSONAS = [
  {
    id: "usr-admin",
    email: "admin@uabindia.in",
    fullName: "Enterprise Admin",
    role: "HRAdmin",
    roleTitle: "HR & Enterprise Administrator",
    department: "Executive Management",
    tenantSubdomain: "erp",
    companyName: "UabIndia ERP",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    employeeId: "EMP-0001",
  },
  {
    id: "usr-01",
    email: "pooja.v@uabindia.in",
    fullName: "Pooja Verma",
    role: "HRAdmin",
    roleTitle: "Head of People & Culture",
    department: "Human Resources",
    tenantSubdomain: "erp",
    companyName: "UabIndia ERP",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    employeeId: "EMP-1002",
  },
  {
    id: "usr-02",
    email: "vikram.singh@uabindia.in",
    fullName: "Vikramaditya Singh",
    role: "Manager",
    roleTitle: "Engineering Team Lead",
    department: "Engineering",
    tenantSubdomain: "erp",
    companyName: "UabIndia ERP",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    employeeId: "EMP-1003",
  },
  {
    id: "usr-03",
    email: "aarav.sharma@uabindia.in",
    fullName: "Aarav Sharma",
    role: "Employee",
    roleTitle: "Staff Software Architect",
    department: "Engineering",
    tenantSubdomain: "erp",
    companyName: "UabIndia ERP",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    employeeId: "EMP-1001",
  },
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem("hrms_token");
      // Purge any legacy fake mock tokens immediately
      if (!storedToken || storedToken === "demo-mock-jwt-token-hrms") {
        localStorage.removeItem("hrms_token");
        localStorage.removeItem("hrms_user");
        return null;
      }
      const stored = localStorage.getItem("hrms_user");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const [tenant, setTenant] = useState(getStoredTenant());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("hrms_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hrms_user");
    }
  }, [user]);

  const login = async ({ email, password, tenantSubdomain }) => {
    setLoading(true);
    const effectiveTenant = (tenantSubdomain && tenantSubdomain.trim()) ? tenantSubdomain.trim() : "erp";
    try {
      setStoredTenant(effectiveTenant);
      setTenant(effectiveTenant);

      // 1. Strictly query backend login API
      const res = await apiClient.post("/auth/login", {
        email: email.trim(),
        username: email.trim(),
        password,
        tenantSubdomain: effectiveTenant,
      });

      const token = res.data?.access_token || res.data?.token;
      if (!token) {
        throw new Error("No authentication token received from the backend.");
      }
      setStoredToken(token);

      // 2. Fetch authenticated user profile
      let userData = res.data?.user;
      if (!userData) {
        try {
          const meRes = await apiClient.get("/auth/me");
          if (meRes.data) {
            userData = meRes.data;
          }
        } catch (meErr) {
          // Fallback if /auth/me is not implemented
        }
      }

      if (!userData) {
        const matched = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
        userData = matched || {
          email: email.trim(),
          fullName: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          role: "HRAdmin",
          roleTitle: "HR Administrator",
          tenantSubdomain: effectiveTenant,
          companyName: "UabIndia ERP",
          avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          employeeId: "EMP-0001",
        };
      }

      if (userData?.companyId) {
        setStoredCompanyId(userData.companyId);
      }

      setUser(userData);
      return { success: true };
    } catch (err) {
      // Ensure no fake state is retained on error
      setStoredToken(null);
      setStoredCompanyId(null);
      setUser(null);

      // Server explicitly returned an HTTP error response
      if (err.response) {
        if (err.response.status === 400 || err.response.status === 401) {
          throw new Error(err.response.data?.message || err.response.data?.error || "Invalid work email or password. Please verify credentials.");
        }
        if (err.response.status === 404) {
          throw new Error("Workspace domain not found on the server. Please verify the organization domain.");
        }
        throw new Error(err.response.data?.message || err.response.data?.error || `Authentication failed (${err.response.status}).`);
      }

      // NO response from server: Backend is not running or network down
      throw new Error(
        "Cannot connect to the backend server. The backend API is not running or unreachable at http://localhost:5000. Please start the backend service before signing in."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setStoredCompanyId(null);
    localStorage.removeItem("hrms_user");
    localStorage.removeItem("hrms_token");
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === "HRAdmin" || user.role === "SuperAdmin" || user.isSystemAdmin) return true;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  const canDo = (action, module) => {
    if (!user) return false;
    if (user.role === "HRAdmin" || user.role === "SuperAdmin" || user.isSystemAdmin) return true;
    if (user.role === "Manager") {
      return ["approve", "review", "read", "view"].includes(action);
    }
    if (user.role === "Recruiter") {
      return module === "recruitment" || module === "candidates";
    }
    return action === "read" || action === "view" || action === "apply";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        loading,
        login,
        logout,
        hasRole,
        canDo,
        isAdmin: user?.role === "HRAdmin" || user?.role === "SuperAdmin" || user?.isSystemAdmin,
        isManager: user?.role === "Manager" || user?.role === "HRAdmin",
        demoPersonas: DEMO_PERSONAS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export default AuthContext;
