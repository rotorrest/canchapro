import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useBrandingStore } from "@/store/brandingStore";
import { api } from "@/lib/api";

// ── Types matching what pages expect ────────────────────────────────────────

export interface Court {
  id: string;
  tenantId: string;
  sedeId: string | null;
  name: string;
  sport: string;
  type: string;
  surface: string;
  capacity: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  // Compat: pages use getCurrentVersion(court) which expects versions[]
  versions: CourtVersion[];
}

export interface CourtVersion {
  id: string;
  courtId: string;
  version: number;
  name: string;
  sport: string;
  type: string;
  surface: string;
  capacity: number;
  priceMultiplier: number;
  createdAt: string;
  changedBy: string;
  reason: string;
}

export interface CourtSchedule {
  id: string;
  courtId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface CourtBlock {
  id: string;
  courtId: string;
  tenantId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  scope: string;
  sedeId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Sede {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  memberId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  creditsDeducted: number;
  status: string;
  cancelledAt: string | null;
  createdAt: string;
  // Enriched fields
  memberName?: string;
  courtName?: string;
}

export interface Member {
  id: string;
  tenantId: string;
  userId: string;
  creditBalance: number;
  creditAllocationMonthly: number;
  lastBookingAt: string | null;
  user: { id: string; name: string; email: string; status: string; role: string };
}

export interface CreditPrice {
  id: string;
  tenantId: string;
  slot: string;
  dayType: string;
  price: number;
  effectiveFrom: string;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  memberId: string;
  amount: number;
  type: string;
  reason: string;
  bookingId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface TenantData {
  sedes: Sede[];
  courts: Court[];
  courtSchedules: CourtSchedule[];
  courtBlocks: CourtBlock[];
  members: Member[];
  clubUsers: { id: string; name: string; email: string; role: string; status: string }[];
  creditPrices: CreditPrice[];
  bookings: Booking[];
  transactions: CreditTransaction[];
  memberComments: never[];
  creditSales: never[];
  schedules: never[];
  availabilityConfig: null;
  specialDays: never[];
  tenantId: string | null;
  hasMultipleSedes: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ── Adapter: transform API court to frontend Court with versions ────────────

function adaptCourt(apiCourt: Record<string, unknown>): Court {
  return {
    id: apiCourt.id as string,
    tenantId: apiCourt.tenantId as string,
    sedeId: (apiCourt.sedeId as string) ?? null,
    name: apiCourt.name as string,
    sport: apiCourt.sport as string,
    type: apiCourt.type as string,
    surface: apiCourt.surface as string,
    capacity: apiCourt.capacity as number,
    isActive: Boolean(apiCourt.isActive),
    createdBy: (apiCourt.createdBy as string) ?? null,
    createdAt: apiCourt.createdAt as string,
    versions: [{
      id: apiCourt.id as string,
      courtId: apiCourt.id as string,
      version: 1,
      name: apiCourt.name as string,
      sport: apiCourt.sport as string,
      type: apiCourt.type as string,
      surface: apiCourt.surface as string,
      capacity: apiCourt.capacity as number,
      priceMultiplier: 1,
      createdAt: apiCourt.createdAt as string,
      changedBy: (apiCourt.createdBy as string) ?? "",
      reason: "Creacion inicial",
    }],
  };
}

// ── Module-level cache (survives page navigations, not full reloads) ────────

interface CacheEntry {
  tenantId: string | null;
  data: Omit<TenantData, "refetch">;
  fetchedAt: number;
}

let _cache: CacheEntry | null = null;
const CACHE_TTL = 30_000; // 30 seconds
let _fetchPromise: Promise<void> | null = null;
const _listeners = new Set<() => void>();

function notifyListeners() { _listeners.forEach((fn) => fn()); }

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTenantData(): TenantData {
  const tenantId = useAuthStore((s) => s.tenantId);
  const token = useAuthStore((s) => s.token);
  const isPlatform = useAuthStore((s) => s.user?.role === "platform_admin");
  const setBranding = useBrandingStore((s) => s.setBranding);

  const emptyData: Omit<TenantData, "refetch"> = {
    sedes: [], courts: [], courtSchedules: [], courtBlocks: [],
    members: [], clubUsers: [], creditPrices: [],
    bookings: [], transactions: [],
    memberComments: [], creditSales: [], schedules: [],
    availabilityConfig: null, specialDays: [],
    tenantId, hasMultipleSedes: false,
    loading: true, error: null,
  };

  // Use cached data if available and fresh for this tenant
  const cachedValid = _cache && _cache.tenantId === tenantId && (Date.now() - _cache.fetchedAt < CACHE_TTL);
  const [data, setData] = useState<Omit<TenantData, "refetch">>(
    cachedValid ? _cache!.data : emptyData
  );

  // Subscribe to cache updates from other components
  useEffect(() => {
    const listener = () => {
      if (_cache && _cache.tenantId === tenantId) {
        setData(_cache.data);
      }
    };
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, [tenantId]);

  const fetchData = useCallback(async (force = false) => {
    if (!token) return;
    if (isPlatform && !tenantId) {
      const d = { ...emptyData, loading: false, tenantId: null };
      _cache = { tenantId: null, data: d, fetchedAt: Date.now() };
      setData(d);
      notifyListeners();
      return;
    }

    // If cache is fresh and not forced, skip
    if (!force && _cache && _cache.tenantId === tenantId && (Date.now() - _cache.fetchedAt < CACHE_TTL)) {
      setData(_cache.data);
      return;
    }

    // Deduplicate concurrent fetches
    if (_fetchPromise && !force) {
      await _fetchPromise;
      if (_cache && _cache.tenantId === tenantId) setData(_cache.data);
      return;
    }

    setData((prev) => ({ ...prev, loading: true, error: null }));

    const doFetch = async () => {
    try {
      // Fetch all endpoints in parallel
      const [courtsRes, sedesRes, bookingsRes, membersRes, schedulesData, blocksData, siteRes] = await Promise.all([
        api.get<{ data: Record<string, unknown>[] }>("/v1/courts"),
        api.get<{ data: Sede[] }>("/v1/sedes"),
        api.get<{ data: Record<string, unknown>[] }>("/v1/bookings"),
        api.get<{ data: Record<string, unknown>[] }>("/v1/members").catch(() => ({ data: [] })),
        // Fetch schedules for each court — we'll batch later
        Promise.resolve({ data: [] as CourtSchedule[] }),
        Promise.resolve({ data: [] as CourtBlock[] }),
        api.get<{ data: { branding: Record<string, unknown> } }>("/v1/site/config").catch(() => null),
      ]);

      const courts = courtsRes.data.map(adaptCourt);

      // Fetch schedules and blocks for each court in parallel
      const allSchedules: CourtSchedule[] = [];
      const allBlocks: CourtBlock[] = [];

      await Promise.all(courts.map(async (court) => {
        try {
          const [schedRes, blkRes] = await Promise.all([
            api.get<{ data: CourtSchedule[] }>(`/v1/courts/${court.id}/schedule`),
            api.get<{ data: CourtBlock[] }>(`/v1/courts/${court.id}/blocks`),
          ]);
          allSchedules.push(...schedRes.data);
          allBlocks.push(...(blkRes.data.map((b) => ({
            ...b,
            tenantId: court.tenantId,
            scope: "court",
            sedeId: court.sedeId,
          }))));
        } catch { /* ignore individual failures */ }
      }));

      // Build member list with user info
      const members: Member[] = (membersRes.data as Record<string, unknown>[]).map((m) => ({
        id: m.id as string,
        tenantId: m.tenantId as string,
        userId: m.userId as string,
        creditBalance: m.creditBalance as number,
        creditAllocationMonthly: m.creditAllocationMonthly as number,
        lastBookingAt: (m.lastBookingAt as string) ?? null,
        user: {
          id: (m.userId as string) ?? "",
          name: (m.name as string) ?? (m.userName as string) ?? "",
          email: (m.email as string) ?? (m.userEmail as string) ?? "",
          status: (m.status as string) ?? (m.userStatus as string) ?? "active",
          role: "member",
        },
      }));

      // Enrich bookings with court/member names
      const courtMap = new Map(courts.map((c) => [c.id, c.name]));
      const memberMap = new Map(members.map((m) => [m.id, m.user.name]));

      const bookings: Booking[] = (bookingsRes.data as Record<string, unknown>[]).map((b) => ({
        id: b.id as string,
        tenantId: b.tenantId as string,
        memberId: b.memberId as string,
        courtId: b.courtId as string,
        startTime: b.startTime as string,
        endTime: b.endTime as string,
        creditsDeducted: b.creditsDeducted as number,
        status: b.status as string,
        cancelledAt: (b.cancelledAt as string) ?? null,
        createdAt: b.createdAt as string,
        memberName: memberMap.get(b.memberId as string) ?? (b.memberName as string) ?? "Socio",
        courtName: courtMap.get(b.courtId as string) ?? (b.courtName as string) ?? "Cancha",
      }));

      // Apply branding
      if (siteRes?.data?.branding) {
        const b = siteRes.data.branding;
        setBranding({
          clubName: b.clubName as string,
          primaryColor: b.primaryColor as string,
          logoUrl: (b.logoUrl as string) ?? null,
        });
      }

      const sedes = sedesRes.data;

      const result = {
        sedes,
        courts,
        courtSchedules: allSchedules,
        courtBlocks: allBlocks,
        members,
        clubUsers: [],
        creditPrices: [],
        bookings,
        transactions: [],
        memberComments: [],
        creditSales: [],
        schedules: [],
        availabilityConfig: null,
        specialDays: [],
        tenantId,
        hasMultipleSedes: sedes.length > 1,
        loading: false,
        error: null,
      } as Omit<TenantData, "refetch">;

      _cache = { tenantId, data: result, fetchedAt: Date.now() };
      setData(result);
      notifyListeners();
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error cargando datos",
      }));
    }
    }; // end doFetch

    _fetchPromise = doFetch().finally(() => { _fetchPromise = null; });
  }, [token, tenantId, isPlatform, setBranding]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // refetch forces cache invalidation
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { ...data, refetch };
}
