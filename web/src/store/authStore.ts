import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/lib/mock-data";
import { MOCK_USERS, authenticateUser, getTenantById } from "@/lib/mock-data";

interface ImpersonateState {
  user: User;
  tenantId: string | null;
  tenantName: string | null;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  tenantName: string | null;
  // Impersonation
  impersonating: ImpersonateState | null; // stores the ORIGINAL platform admin state
  impersonatedTenantName: string | null;
  // Login by email/password (multi-tenant)
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
  // Legacy: login by role (for quick demo access)
  login: (role: Role) => void;
  logout: () => void;
  // Impersonation
  impersonate: (tenantId: string, tenantName: string) => void;
  exitImpersonate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenantId: null,
      tenantName: null,
      impersonating: null,
      impersonatedTenantName: null,
      loginWithCredentials: (email, password) => {
        const cred = authenticateUser(email, password);
        if (!cred) return { success: false, error: "Correo o contrasena incorrectos." };
        const tenant = cred.tenantId ? getTenantById(cred.tenantId) : null;
        set({
          user: cred.user,
          tenantId: cred.tenantId,
          tenantName: tenant?.name ?? (cred.tenantId ? null : "CanchaPro"),
          impersonating: null,
          impersonatedTenantName: null,
        });
        return { success: true };
      },
      login: (role) => {
        set({ user: MOCK_USERS[role], tenantId: "t1", tenantName: "Ica Padel Club", impersonating: null, impersonatedTenantName: null });
      },
      logout: () => set({ user: null, tenantId: null, tenantName: null, impersonating: null, impersonatedTenantName: null }),
      impersonate: (tenantId, tenantName) => {
        const state = get();
        if (!state.user || state.user.role !== "platform_admin") return;
        // Save current platform admin state
        set({
          impersonating: {
            user: state.user,
            tenantId: state.tenantId,
            tenantName: state.tenantName,
          },
          impersonatedTenantName: tenantName,
          // Switch to club admin view
          user: { ...state.user, role: "super_admin" },
          tenantId,
          tenantName,
        });
      },
      exitImpersonate: () => {
        const state = get();
        if (!state.impersonating) return;
        set({
          user: state.impersonating.user,
          tenantId: state.impersonating.tenantId,
          tenantName: state.impersonating.tenantName,
          impersonating: null,
          impersonatedTenantName: null,
        });
      },
    }),
    { name: "ica-padel-auth" }
  )
);
