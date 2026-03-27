-- CanchaPro seed data for development
-- Passwords: all use SHA-256(password + userId) where password = 'admin123'

-- ── Rate Card (aligned with landing page prices) ────────────────────────────

INSERT INTO rate_cards (id, name, effective_from, is_default) VALUES
  ('rc1', 'Tarifa v1 - Marzo 2026', '2026-03-01', 1);

INSERT INTO rate_card_plans (id, rate_card_id, plan, base_price, fee_per_booking, free_bookings, max_courts) VALUES
  ('rcp1', 'rc1', 'starter', 0,   1.00, 150, 2),
  ('rcp2', 'rc1', 'pro',     79,  0.80, 0,   9),
  ('rcp3', 'rc1', 'business', 149, 0.50, 0,   NULL);

-- ── Tenants ─────────────────────────────────────────────────────────────────

INSERT INTO tenants (id, slug, name, plan, status, rate_card_id) VALUES
  ('t1', 'ica-padel', 'Ica Padel Club', 'pro', 'active', 'rc1'),
  ('t2', 'lima-padel', 'Lima Padel Center', 'business', 'active', 'rc1');

INSERT INTO tenant_branding (tenant_id, club_name, primary_color) VALUES
  ('t1', 'Ica Padel Club', '#1e3a8a'),
  ('t2', 'Lima Padel Center', '#065f46');

-- ── Users ───────────────────────────────────────────────────────────────────
-- Passwords are SHA-256('admin123' + id) base64-encoded.
-- In production, use proper PBKDF2/bcrypt via Web Crypto.

INSERT INTO users (id, tenant_id, email, name, role, status, password_hash) VALUES
  -- Platform admin
  ('u0', NULL, 'admin@lumini.dev', 'Rodrigo Lumini', 'platform_admin', 'active', '__SEED_HASH__'),
  -- Ica Padel Club
  ('u1', 't1', 'admin@icapc.com', 'Carlos Mendoza', 'super_admin', 'active', '__SEED_HASH__'),
  ('u2', 't1', 'staff@icapc.com', 'Ana Torres', 'staff', 'active', '__SEED_HASH__'),
  ('u3', 't1', 'socio@icapc.com', 'Pedro Ramirez', 'member', 'active', '__SEED_HASH__'),
  -- Lima Padel Center
  ('u10', 't2', 'admin@limacp.com', 'Miguel Sanchez', 'super_admin', 'active', '__SEED_HASH__'),
  ('u11', 't2', 'staff@limacp.com', 'Laura Diaz', 'staff', 'active', '__SEED_HASH__'),
  ('u12', 't2', 'socio@limacp.com', 'Roberto Silva', 'member', 'active', '__SEED_HASH__');

-- ── Members ─────────────────────────────────────────────────────────────────

INSERT INTO members (id, tenant_id, user_id, credit_balance, credit_allocation_monthly) VALUES
  ('m1', 't1', 'u3', 15, 20),
  ('m2', 't2', 'u12', 8, 15);

-- ── Sedes ───────────────────────────────────────────────────────────────────

INSERT INTO sedes (id, tenant_id, name, address, city) VALUES
  ('s1', 't1', 'Sede Principal', 'Av. Los Maestros 123, Ica', 'Ica'),
  ('s2', 't2', 'Lima Norte', 'Av. Universitaria 456, Los Olivos', 'Lima'),
  ('s3', 't2', 'Lima Sur', 'Av. Primavera 789, Surco', 'Lima');

-- ── Courts ──────────────────────────────────────────────────────────────────

INSERT INTO courts (id, tenant_id, sede_id, name, sport, type, surface, capacity, is_active, created_by) VALUES
  ('c1', 't1', 's1', 'Cancha 1', 'padel', 'outdoor', 'Cesped artificial', 4, 1, 'u1'),
  ('c2', 't1', 's1', 'Cancha 2', 'padel', 'indoor',  'Cesped sintetico premium', 4, 1, 'u1'),
  ('c3', 't1', 's1', 'Cancha 3', 'padel', 'covered', 'Cesped artificial', 4, 1, 'u1'),
  ('c4', 't1', 's1', 'Cancha 4', 'tenis', 'outdoor', 'Arcilla', 2, 1, 'u1'),
  ('c5', 't2', 's2', 'Cancha Central', 'padel', 'indoor', 'Cristal', 4, 1, 'u10'),
  ('c6', 't2', 's2', 'Cancha Norte', 'padel', 'outdoor', 'Cesped artificial', 4, 1, 'u10'),
  ('c7', 't2', 's3', 'Cancha Sur', 'padel', 'indoor', 'Cesped sintetico', 4, 1, 'u10'),
  ('c8', 't2', 's3', 'Cancha VIP', 'padel', 'indoor', 'Cristal premium', 4, 1, 'u10');

-- ── Court Schedules (Mon=0 ... Sun=6) ───────────────────────────────────────

-- Ica courts: Mon-Fri 6-22, Sat-Sun 7-22
INSERT INTO court_schedules (id, court_id, day_of_week, open_time, close_time, is_closed) VALUES
  ('cs1',  'c1', 0, '06:00', '22:00', 0),
  ('cs2',  'c1', 1, '06:00', '22:00', 0),
  ('cs3',  'c1', 2, '06:00', '22:00', 0),
  ('cs4',  'c1', 3, '06:00', '22:00', 0),
  ('cs5',  'c1', 4, '06:00', '22:00', 0),
  ('cs6',  'c1', 5, '07:00', '22:00', 0),
  ('cs7',  'c1', 6, '07:00', '22:00', 0),
  ('cs8',  'c2', 0, '06:00', '22:00', 0),
  ('cs9',  'c2', 1, '06:00', '22:00', 0),
  ('cs10', 'c2', 2, '06:00', '22:00', 0),
  ('cs11', 'c2', 3, '06:00', '22:00', 0),
  ('cs12', 'c2', 4, '06:00', '22:00', 0),
  ('cs13', 'c2', 5, '07:00', '22:00', 0),
  ('cs14', 'c2', 6, '07:00', '22:00', 0);

-- ── Credit Prices ───────────────────────────────────────────────────────────

INSERT INTO credit_prices (id, tenant_id, slot, day_type, price, effective_from, updated_by) VALUES
  ('cp1', 't1', 'morning',   'weekday', 1, '2026-01-01', 'u1'),
  ('cp2', 't1', 'afternoon', 'weekday', 2, '2026-01-01', 'u1'),
  ('cp3', 't1', 'evening',   'weekday', 3, '2026-01-01', 'u1'),
  ('cp4', 't1', 'morning',   'weekend', 2, '2026-01-01', 'u1'),
  ('cp5', 't1', 'afternoon', 'weekend', 3, '2026-01-01', 'u1'),
  ('cp6', 't1', 'evening',   'weekend', 3, '2026-01-01', 'u1');
