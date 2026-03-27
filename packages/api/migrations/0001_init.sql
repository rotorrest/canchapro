-- CanchaPro initial schema
-- Generated from packages/api/src/db/schema.ts

-- ── Tenants ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK(plan IN ('starter', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK(status IN ('active', 'suspended', 'trial')),
  custom_domain TEXT,
  rate_card_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
  club_name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#1d5092',
  logo_url TEXT,
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  photos TEXT DEFAULT '[]'
);

-- ── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('platform_admin', 'super_admin', 'staff', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'inactive')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ── Members ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  credit_balance REAL NOT NULL DEFAULT 0,
  credit_allocation_monthly INTEGER NOT NULL DEFAULT 0,
  last_booking_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_tenant ON members(tenant_id);

-- ── Sedes ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sedes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sedes_tenant ON sedes(tenant_id);

-- ── Courts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  sede_id TEXT REFERENCES sedes(id),
  name TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'padel' CHECK(sport IN ('padel', 'tenis', 'futbol', 'squash', 'pickleball', 'frontenis', 'otro')),
  type TEXT NOT NULL CHECK(type IN ('indoor', 'outdoor', 'covered')),
  surface TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_courts_tenant ON courts(tenant_id);

CREATE TABLE IF NOT EXISTS court_schedules (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL REFERENCES courts(id),
  day_of_week INTEGER NOT NULL,
  open_time TEXT,
  close_time TEXT,
  is_closed INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_court_day ON court_schedules(court_id, day_of_week);

CREATE TABLE IF NOT EXISTS court_blocks (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL REFERENCES courts(id),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  reason TEXT DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  court_id TEXT NOT NULL REFERENCES courts(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  credits_deducted REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_time ON bookings(court_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);

-- ── Credits ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS credit_prices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  slot TEXT NOT NULL CHECK(slot IN ('morning', 'afternoon', 'evening')),
  day_type TEXT NOT NULL CHECK(day_type IN ('weekday', 'weekend')),
  price REAL NOT NULL,
  effective_from TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('allocation', 'deduction', 'adjustment')),
  reason TEXT DEFAULT '',
  booking_id TEXT REFERENCES bookings(id),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_tenant ON credit_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_member ON credit_transactions(member_id);

CREATE TABLE IF NOT EXISTS credit_sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  member_id TEXT NOT NULL REFERENCES members(id),
  amount REAL NOT NULL,
  price_paid REAL NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Rate Cards (billing) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_card_plans (
  id TEXT PRIMARY KEY,
  rate_card_id TEXT NOT NULL REFERENCES rate_cards(id),
  plan TEXT NOT NULL CHECK(plan IN ('starter', 'pro', 'business')),
  base_price REAL NOT NULL,
  fee_per_booking REAL NOT NULL,
  free_bookings INTEGER NOT NULL DEFAULT 0,
  max_courts INTEGER
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  period TEXT NOT NULL,
  plan TEXT NOT NULL,
  base_price REAL NOT NULL,
  bookings_count INTEGER NOT NULL,
  fee_per_booking REAL NOT NULL,
  free_bookings INTEGER NOT NULL,
  variable_total REAL NOT NULL,
  total REAL NOT NULL,
  rate_card_id TEXT REFERENCES rate_cards(id),
  rate_card_name TEXT NOT NULL,
  add_on_line_items TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Add-ons (marketplace) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS add_ons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'package',
  tier TEXT NOT NULL DEFAULT 'a' CHECK(tier IN ('a', 'b', 'c', 'd')),
  price_type TEXT NOT NULL CHECK(price_type IN ('flat_monthly', 'per_unit', 'percentage', 'included')),
  price REAL NOT NULL,
  available_on_plans TEXT NOT NULL DEFAULT '["starter","pro","business"]',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'beta', 'deprecated')),
  effective_from TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_add_ons (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  add_on_id TEXT NOT NULL REFERENCES add_ons(id),
  price_override REAL,
  activated_at TEXT NOT NULL,
  cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant ON tenant_add_ons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_addons_addon ON tenant_add_ons(add_on_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_addon_unique ON tenant_add_ons(tenant_id, add_on_id);
