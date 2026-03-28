import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TenantBranding {
  primaryColor: string;
  accentColor?: string;
  logoUrl: string | null;
  clubName: string;
}

const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: "#1e3a8a",
  accentColor: "#3b82f6",
  logoUrl: null,
  clubName: "Mi Club",
};

interface BrandingState {
  branding: TenantBranding;
  setBranding: (branding: Partial<TenantBranding>) => void;
  reset: () => void;
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      branding: DEFAULT_BRANDING,
      setBranding: (b) => set((s) => ({ branding: { ...s.branding, ...b } })),
      reset: () => set({ branding: DEFAULT_BRANDING }),
    }),
    { name: "canchapro-branding" }
  )
);
