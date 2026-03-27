import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  COURTS,
  COURT_SCHEDULES,
  COURT_BLOCKS,
  MEMBERS,
  CLUB_USERS,
  CREDIT_PRICES,
  BOOKINGS,
  TRANSACTIONS,
  MEMBER_COMMENTS,
  CREDIT_SALES,
  SEDES,
  SCHEDULES,
  AVAILABILITY_CONFIGS,
  SPECIAL_DAYS,
  getAvailabilityConfig,
} from "@/lib/mock-data";

/**
 * Returns all data filtered by the current tenant.
 * Platform admin (tenantId === null) sees ALL data across tenants.
 */
export function useTenantData() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const isPlatform = useAuthStore((s) => s.user?.role === "platform_admin");

  return useMemo(() => {
    if (isPlatform || !tenantId) {
      return {
        sedes: SEDES,
        courts: COURTS,
        courtSchedules: COURT_SCHEDULES,
        courtBlocks: COURT_BLOCKS,
        members: MEMBERS,
        clubUsers: CLUB_USERS,
        creditPrices: CREDIT_PRICES,
        bookings: BOOKINGS,
        transactions: TRANSACTIONS,
        memberComments: MEMBER_COMMENTS,
        creditSales: CREDIT_SALES,
        schedules: SCHEDULES,
        availabilityConfig: AVAILABILITY_CONFIGS[0],
        specialDays: SPECIAL_DAYS,
        tenantId: null,
        hasMultipleSedes: false,
      };
    }

    const tenantSedes = SEDES.filter((s) => s.tenantId === tenantId);
    const tenantCourts = COURTS.filter((c) => c.tenantId === tenantId);
    const courtIds = new Set(tenantCourts.map((c) => c.id));

    return {
      sedes: tenantSedes,
      courts: tenantCourts,
      courtSchedules: COURT_SCHEDULES.filter((s) => courtIds.has(s.courtId)),
      courtBlocks: COURT_BLOCKS.filter((b) => b.tenantId === tenantId || (b.courtId && courtIds.has(b.courtId))),
      members: MEMBERS.filter((m) => m.tenantId === tenantId),
      clubUsers: CLUB_USERS.filter((u) => u.tenantId === tenantId),
      creditPrices: CREDIT_PRICES.filter((p) => p.tenantId === tenantId),
      bookings: BOOKINGS.filter((b) => b.tenantId === tenantId),
      transactions: TRANSACTIONS.filter((t) => t.tenantId === tenantId),
      memberComments: MEMBER_COMMENTS.filter((c) => c.tenantId === tenantId),
      creditSales: CREDIT_SALES.filter((s) => s.tenantId === tenantId),
      schedules: SCHEDULES.filter((s) => s.tenantId === tenantId),
      availabilityConfig: getAvailabilityConfig(tenantId),
      specialDays: SPECIAL_DAYS.filter((sd) => sd.tenantId === tenantId),
      tenantId,
      hasMultipleSedes: tenantSedes.length > 1,
    };
  }, [tenantId, isPlatform]);
}
