"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, type ReactNode } from "react";
import { messages, defaultLocale, type Locale } from "@/i18n";
import { formatPlural } from "@/i18n";
import { getCurrentUser, setCurrentUser } from "@/lib/api-client";

// ── i18n Context ──
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, values?: Record<string, number>) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function useTranslation() {
  return useContext(I18nContext);
}

// ── Auth Context ──
interface AuthContextValue {
  userId: string;
  role: string;
  userName: string;
  switchUser: (userId: string, role: string, name: string) => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

// Stub users for easy switching in the UI
export const STUB_USERS = [
  { userId: "user-1", name: "Alice Johnson", role: "student" },
  { userId: "user-2", name: "Bob Smith", role: "student" },
  { userId: "user-3", name: "Carlos Garcia", role: "student" },
  { userId: "user-4", name: "Diana Lee", role: "student" },
  { userId: "user-5", name: "Mod Emily", role: "moderator" },
];

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
  );
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [authState, setAuthState] = useState({
    userId: "user-1",
    role: "student",
    userName: "Alice Johnson",
  });

  const t = (key: string, values?: Record<string, number>): string => {
    const keys = key.split(".");
    let value: unknown = messages[locale];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    if (typeof value !== "string") return key;
    if (values) return formatPlural(value, values);
    return value;
  };

  const switchUser = (userId: string, role: string, name: string) => {
    setCurrentUser(userId, role);
    setAuthState({ userId, role, userName: name });
    queryClient.invalidateQueries();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <I18nContext.Provider value={{ locale, setLocale, t }}>
        <AuthContext.Provider
          value={{
            ...authState,
            switchUser,
          }}
        >
          {children}
        </AuthContext.Provider>
      </I18nContext.Provider>
    </QueryClientProvider>
  );
}
