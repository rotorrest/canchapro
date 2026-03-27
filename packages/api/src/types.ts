import type { Database } from "./db";
import type { User } from "@canchapro/shared";

export interface Bindings {
  DB: D1Database;
  TENANT_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  UPLOADS: R2Bucket;
  NOTIFICATIONS_QUEUE: Queue;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface Variables {
  db: Database;
  tenantId: string | null;
  tenantSlug: string | null;
  user: User;
}
