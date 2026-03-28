# Shared — TypeScript Types and Constants

Shared package consumed by both the API and the frontend apps. Contains type definitions that mirror the database schema and constants used across the system.

## Files

| File | Contents |
|---|---|
| `types.ts` | 23 interfaces (User, Court, Booking, Member, Tenant, etc.) |
| `constants.ts` | Slot hours, booking window, payment methods, plans |

## Usage

```ts
import { User, Court } from "@canchapro/shared"
```

## Important: Web Frontend Has Its Own Types

The web dashboard does NOT import from this package directly for its data hooks. Instead, `packages/web/src/hooks/useTenantData.ts` defines its own adapted versions of these types with extra fields (for example, `Court` there includes a `versions[]` array).

The shared types here match the DB schema exactly. The web frontend types extend them with UI-specific concerns. If you change a type here, check whether the web frontend types also need updating.
