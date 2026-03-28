import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export type Role = "platform_admin" | "super_admin" | "staff" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  tenantId?: string | null;
}

interface ImpersonateState {
  user: User;
  tenantId: string | null;
  tenantName: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  tenantName: string | null;
  impersonating: ImpersonateState | null;
  impersonatedTenantName: string | null;
  loginWithCredentials: (email: string, password: string, tenantId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  impersonate: (tenantId: string, tenantName: string) => void;
  exitImpersonate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tenantId: null,
      tenantName: null,
      impersonating: null,
      impersonatedTenantName: null,

      loginWithCredentials: async (email, password, tenantId?) => {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (tenantId) headers["x-tenant-id"] = tenantId;

          const res = await fetch("/v1/auth/login", {
            method: "POST",
            headers,
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            return { success: false, error: data.error ?? "Credenciales invalidas" };
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            status: data.user.status,
            tenantId: data.user.tenantId,
          };

          // Configure API client with token and tenant
          api.setToken(data.token);
          api.setTenantId(data.user.tenantId);

          set({
            user,
            token: data.token,
            tenantId: data.user.tenantId,
            tenantName: data.tenantName ?? (data.user.role === "platform_admin" ? "CanchaPro" : null),
            impersonating: null,
            impersonatedTenantName: null,
          });

          return { success: true };
        } catch {
          return { success: false, error: "Error de conexion con el servidor" };
        }
      },

      logout: () => {
        api.setToken(null);
        api.setTenantId(null);
        set({
          user: null,
          token: null,
          tenantId: null,
          tenantName: null,
          impersonating: null,
          impersonatedTenantName: null,
        });
      },

      impersonate: (tenantId, tenantName) => {
        const state = get();
        if (!state.user || state.user.role !== "platform_admin") return;
        api.setTenantId(tenantId);
        set({
          impersonating: {
            user: state.user,
            tenantId: state.tenantId,
            tenantName: state.tenantName,
          },
          impersonatedTenantName: tenantName,
          user: { ...state.user, role: "super_admin" as Role },
          tenantId,
          tenantName,
        });
      },

      exitImpersonate: () => {
        const state = get();
        if (!state.impersonating) return;
        api.setTenantId(state.impersonating.tenantId);
        set({
          user: state.impersonating.user,
          tenantId: state.impersonating.tenantId,
          tenantName: state.impersonating.tenantName,
          impersonating: null,
          impersonatedTenantName: null,
        });
      },
    }),
    {
      name: "canchapro-auth",
      onRehydrate: () => {
        // After rehydrating from localStorage, configure the API client
        return (state) => {
          if (state?.token) {
            api.setToken(state.token);
            api.setTenantId(state.tenantId);
          }
        };
      },
    }
  )
);
