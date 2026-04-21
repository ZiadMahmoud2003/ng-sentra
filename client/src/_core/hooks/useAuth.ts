import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// Development mode flag - use mock user if OAuth is not configured
const DEV_MODE = import.meta.env.DEV && !import.meta.env.VITE_OAUTH_PORTAL_URL;

// Mock user for development mode
const MOCK_DEV_USER = {
  id: 1,
  openId: "dev-user-123",
  name: "Development User",
  email: "dev@localhost",
  loginMethod: "dev" as const,
  role: "Admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // In dev mode, skip the auth query and use mock user
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !DEV_MODE, // Disable the query in dev mode
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      if (!DEV_MODE) {
        await logoutMutation.mutateAsync();
      }
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // In dev mode, use mock user
    const userData = DEV_MODE ? MOCK_DEV_USER : meQuery.data;
    
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(userData)
    );
    return {
      user: userData ?? null,
      loading: DEV_MODE ? false : meQuery.isLoading || logoutMutation.isPending,
      error: DEV_MODE ? null : meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: DEV_MODE ? true : Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (DEV_MODE) return; // Skip redirect in dev mode
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => (DEV_MODE ? Promise.resolve() : meQuery.refetch()),
    logout,
  };
}
