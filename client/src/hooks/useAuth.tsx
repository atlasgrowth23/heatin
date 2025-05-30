import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on app load
  const { data: currentUser, isLoading: isCheckingAuth } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser);
    }
  }, [currentUser]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || "Login failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || "Logout failed");
    },
  });

  const login = async (username: string, password: string) => {
    setError(null);
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    setError(null);
    await logoutMutation.mutateAsync();
  };

  const value: AuthContextType = {
    user,
    isLoading: isCheckingAuth || loginMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
