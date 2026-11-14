import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  bootstrapped: boolean;
  bootstrapError: string | null;
  signOut: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const lastBootstrappedUser = useRef<string | null>(null);

  const runBootstrap = useCallback(async (userId: string) => {
    if (lastBootstrappedUser.current === userId) {
      setBootstrapped(true);
      return;
    }
    try {
      setBootstrapError(null);
      await api.bootstrap();
      lastBootstrappedUser.current = userId;
      setBootstrapped(true);
    } catch (err) {
      setBootstrapError(err instanceof Error ? err.message : "Failed initializing demo workspace");
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
      if (data.session?.user) {
        void runBootstrap(data.session.user.id);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      if (nextSession?.user) {
        void runBootstrap(nextSession.user.id);
      } else {
        lastBootstrappedUser.current = null;
        setBootstrapped(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [runBootstrap]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    lastBootstrappedUser.current = null;
    setBootstrapped(false);
  }, []);

  const retryBootstrap = useCallback(async () => {
    if (session?.user) {
      lastBootstrappedUser.current = null;
      await runBootstrap(session.user.id);
    }
  }, [runBootstrap, session]);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        bootstrapped,
        bootstrapError,
        signOut,
        retryBootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

