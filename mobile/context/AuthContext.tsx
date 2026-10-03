// context/AuthContext.tsx – Session persistence + notifications
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User, setApiAuth, clearApiAuth } from "../utils/api";
import { saveAuthData, loadAuthData, clearAuthData } from "../utils/storage";
import { registerForPushNotifications } from "../utils/notifications";

export type { User };

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadAuthData();
        if (saved) {
          setUser(saved.user);
          setToken(saved.token);
          setApiAuth(saved.token, saved.user.tenantId, saved.user.companyId);
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const login = async (u: User, t: string) => {
    setUser(u);
    setToken(t);
    setApiAuth(t, u.tenantId, u.companyId);
    await saveAuthData(u, t);
    // Register push notifications (silently)
    try {
      await registerForPushNotifications();
    } catch {}
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    clearApiAuth();
    await clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
