# Web Dashboard

React 18 SPA — dashboard for all 4 roles (platform admin, club admin, staff, member).

## Stack

Vite, Tailwind CSS, Zustand (auth/branding/sede stores), React Router, Lucide icons, Recharts, Radix UI.

## File Layout

```
src/
├── App.tsx              Router with role-based guards (RequireAuth, RequirePlatformAdmin, etc.)
├── main.tsx             Entry point
├── lib/
│   ├── api.ts           API client singleton (token from localStorage fallback)
│   ├── domain.ts        Pure utility functions (status labels, sport labels, etc.)
│   └── utils.ts         Tailwind cn() helper
├── hooks/
│   └── useTenantData.ts Central data hook — fetches from API, 30s cache, returns typed data
├── store/
│   ├── authStore.ts     JWT auth, login/logout, impersonation
│   ├── brandingStore.ts Club branding (colors, logo)
│   └── sedeStore.ts     Selected sede filter
├── components/
│   ├── Layout.tsx        Sidebar/bottom-nav with role-based sections
│   ├── SedeSelector.tsx  Multi-sede picker
│   ├── PadelIcon.tsx     Custom SVG icon
│   ├── DatePicker.tsx    Calendar popover
│   ├── PhoneInput.tsx    Phone with country code
│   └── ui/              Radix primitives (button, calendar, popover)
└── pages/               30 pages (see list below)
```

## Pages by Role

- **Member**: BookCourtPage, MyBookingsPage, BalancePage, MyQRPage
- **Staff**: + AgendaPage, BookingsPage, CourtsPage, MembersPage, CreditsPage
- **Admin**: + DashboardPage, SedesPage, PeoplePage, BillingPage, MarketplacePage, BrandingPage, ReportsPage
- **Platform**: PlatformPage, OnboardingPage, TicketQueuePage

## Data Flow

`useTenantData()` fetches courts/bookings/members/sedes from API. Pages consume data via that hook. Mutations call `api.post()` then `td.refetch()` to update the cache.

## Key Rules

- Never import from `@/lib/mock-data` — it is legacy.
- All hooks before early returns (React rules of hooks).
- Types come from `@/hooks/useTenantData`, utilities from `@/lib/domain`.
- After mutations: always call `td.refetch()` to update cache.
