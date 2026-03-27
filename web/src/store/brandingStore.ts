import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TenantBranding } from "@/lib/mock-data";
import { TENANTS, DEFAULT_BRANDING } from "@/lib/mock-data";

interface BrandingState {
  branding: TenantBranding;
  setBranding: (branding: TenantBranding) => void;
  reset: () => void;
}

// Default to tenant t1 (Ica Padel Club) branding
const initial = TENANTS[0]?.branding ?? DEFAULT_BRANDING;

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      branding: initial,
      setBranding: (branding) => set({ branding }),
      reset: () => set({ branding: initial }),
    }),
    { name: "ica-padel-branding" }
  )
);
