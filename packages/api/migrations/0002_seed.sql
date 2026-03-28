-- CanchaPro seed data
-- Clubs: IcaDemo Padel Club, LimaDemo Padel Club
-- Platform: Lumini (admin@lumini.dev)
-- All passwords: admin123 (hashed via generate-seed.mjs)

-- ── Rate Card ───────────────────────────────────────────────────────────────

INSERT INTO rate_cards (id, name, effective_from, is_default) VALUES
  ('rc1', 'Tarifa v1 - 2026', '2026-01-01', 1);

INSERT INTO rate_card_plans (id, rate_card_id, plan, base_price, fee_per_booking, free_bookings, max_courts) VALUES
  ('rcp1', 'rc1', 'starter', 0,   1.00, 150, 2),
  ('rcp2', 'rc1', 'pro',     79,  0.80, 0,   9),
  ('rcp3', 'rc1', 'business', 149, 0.50, 0,   NULL);

-- ── Tenants ─────────────────────────────────────────────────────────────────

INSERT INTO tenants (id, slug, name, plan, status, rate_card_id) VALUES
  ('t1', 'icademo-padel', 'IcaDemo Padel Club', 'pro', 'active', 'rc1'),
  ('t2', 'limademo-padel', 'LimaDemo Padel Club', 'business', 'active', 'rc1');

INSERT INTO tenant_branding (tenant_id, club_name, primary_color, hero_title, hero_subtitle, address, phone, instagram, hours) VALUES
  ('t1', 'IcaDemo Padel Club', '#1e3a8a', 'Reserva tu cancha en IcaDemo', 'El mejor padel de Ica', 'Av. Los Maestros 123, Ica', '+51 956 123 456', '@icademopadel', 'Lun-Vie 6am-10pm, Sab-Dom 7am-10pm'),
  ('t2', 'LimaDemo Padel Club', '#065f46', 'Padel en Lima Norte y Sur', 'Dos sedes, una pasion', 'Av. Universitaria 456, Los Olivos', '+51 987 654 321', '@limademopadel', 'Lun-Dom 6am-11pm');

-- ── Users ───────────────────────────────────────────────────────────────────
-- password_hash = SHA-256('admin123' + userId) → replaced by generate-seed.mjs

INSERT INTO users (id, tenant_id, email, name, role, status, password_hash) VALUES
  -- Platform
  ('u0',  NULL, 'admin@lumini.dev',     'Rodrigo Lumini',   'platform_admin', 'active', '__SEED_HASH__'),
  -- IcaDemo
  ('u1',  't1', 'admin@icademo.com',    'Carlos Mendoza',   'super_admin',    'active', '__SEED_HASH__'),
  ('u2',  't1', 'staff@icademo.com',    'Ana Torres',       'staff',          'active', '__SEED_HASH__'),
  ('u3',  't1', 'socio1@icademo.com',   'Pedro Ramirez',    'member',         'active', '__SEED_HASH__'),
  ('u4',  't1', 'socio2@icademo.com',   'Maria Lopez',      'member',         'active', '__SEED_HASH__'),
  -- LimaDemo
  ('u10', 't2', 'admin@limademo.com',   'Miguel Sanchez',   'super_admin',    'active', '__SEED_HASH__'),
  ('u11', 't2', 'staff@limademo.com',   'Laura Diaz',       'staff',          'active', '__SEED_HASH__'),
  ('u12', 't2', 'socio1@limademo.com',  'Roberto Silva',    'member',         'active', '__SEED_HASH__'),
  ('u13', 't2', 'socio2@limademo.com',  'Sofia Garcia',     'member',         'active', '__SEED_HASH__');

-- ── Members ─────────────────────────────────────────────────────────────────

INSERT INTO members (id, tenant_id, user_id, credit_balance, credit_allocation_monthly) VALUES
  ('m1', 't1', 'u3',  15, 20),
  ('m2', 't1', 'u4',  8,  10),
  ('m3', 't2', 'u12', 20, 25),
  ('m4', 't2', 'u13', 5,  15);

-- ── Sedes ───────────────────────────────────────────────────────────────────

INSERT INTO sedes (id, tenant_id, name, address, city) VALUES
  ('s1', 't1', 'Sede Principal',  'Av. Los Maestros 123, Ica',           'Ica'),
  ('s2', 't2', 'Lima Norte',      'Av. Universitaria 456, Los Olivos',   'Lima'),
  ('s3', 't2', 'Lima Sur',        'Av. Primavera 789, Surco',            'Lima');

-- ── Courts ──────────────────────────────────────────────────────────────────

INSERT INTO courts (id, tenant_id, sede_id, name, sport, type, surface, capacity, is_active, created_by) VALUES
  -- IcaDemo (4 courts, 1 sede)
  ('c1', 't1', 's1', 'Cancha 1', 'padel', 'outdoor', 'Cesped artificial',       4, 1, 'u1'),
  ('c2', 't1', 's1', 'Cancha 2', 'padel', 'indoor',  'Cesped sintetico premium', 4, 1, 'u1'),
  ('c3', 't1', 's1', 'Cancha 3', 'padel', 'covered', 'Cesped artificial',       4, 1, 'u1'),
  ('c4', 't1', 's1', 'Cancha 4', 'tenis', 'outdoor', 'Arcilla',                 2, 1, 'u1'),
  -- LimaDemo (6 courts, 2 sedes)
  ('c5', 't2', 's2', 'Cancha Central',  'padel', 'indoor',  'Cristal',                  4, 1, 'u10'),
  ('c6', 't2', 's2', 'Cancha Norte',    'padel', 'outdoor', 'Cesped artificial',         4, 1, 'u10'),
  ('c7', 't2', 's2', 'Cancha Express',  'padel', 'covered', 'Cesped sintetico',          4, 1, 'u10'),
  ('c8', 't2', 's3', 'Cancha Sur 1',    'padel', 'indoor',  'Cristal premium',           4, 1, 'u10'),
  ('c9', 't2', 's3', 'Cancha Sur 2',    'padel', 'outdoor', 'Cesped artificial',         4, 1, 'u10'),
  ('c10','t2', 's3', 'Cancha VIP',      'padel', 'indoor',  'Cristal + iluminacion LED', 4, 1, 'u10');

-- ── Court Schedules (Mon=0..Sun=6) ──────────────────────────────────────────
-- IcaDemo: all 4 courts Mon-Fri 06-22, Sat-Sun 07-22

INSERT INTO court_schedules (id, court_id, day_of_week, open_time, close_time, is_closed) VALUES
  -- Court c1
  ('cs1',  'c1', 0, '06:00', '22:00', 0), ('cs2',  'c1', 1, '06:00', '22:00', 0),
  ('cs3',  'c1', 2, '06:00', '22:00', 0), ('cs4',  'c1', 3, '06:00', '22:00', 0),
  ('cs5',  'c1', 4, '06:00', '22:00', 0), ('cs6',  'c1', 5, '07:00', '22:00', 0),
  ('cs7',  'c1', 6, '07:00', '22:00', 0),
  -- Court c2
  ('cs8',  'c2', 0, '06:00', '22:00', 0), ('cs9',  'c2', 1, '06:00', '22:00', 0),
  ('cs10', 'c2', 2, '06:00', '22:00', 0), ('cs11', 'c2', 3, '06:00', '22:00', 0),
  ('cs12', 'c2', 4, '06:00', '22:00', 0), ('cs13', 'c2', 5, '07:00', '22:00', 0),
  ('cs14', 'c2', 6, '07:00', '22:00', 0),
  -- Court c3
  ('cs15', 'c3', 0, '06:00', '22:00', 0), ('cs16', 'c3', 1, '06:00', '22:00', 0),
  ('cs17', 'c3', 2, '06:00', '22:00', 0), ('cs18', 'c3', 3, '06:00', '22:00', 0),
  ('cs19', 'c3', 4, '06:00', '22:00', 0), ('cs20', 'c3', 5, '07:00', '22:00', 0),
  ('cs21', 'c3', 6, '07:00', '22:00', 0),
  -- Court c4
  ('cs22', 'c4', 0, '06:00', '22:00', 0), ('cs23', 'c4', 1, '06:00', '22:00', 0),
  ('cs24', 'c4', 2, '06:00', '22:00', 0), ('cs25', 'c4', 3, '06:00', '22:00', 0),
  ('cs26', 'c4', 4, '06:00', '22:00', 0), ('cs27', 'c4', 5, '07:00', '22:00', 0),
  ('cs28', 'c4', 6, '07:00', '22:00', 0),
  -- LimaDemo courts c5-c10: all days 06-23
  ('cs30', 'c5', 0, '06:00', '23:00', 0), ('cs31', 'c5', 1, '06:00', '23:00', 0),
  ('cs32', 'c5', 2, '06:00', '23:00', 0), ('cs33', 'c5', 3, '06:00', '23:00', 0),
  ('cs34', 'c5', 4, '06:00', '23:00', 0), ('cs35', 'c5', 5, '06:00', '23:00', 0),
  ('cs36', 'c5', 6, '06:00', '23:00', 0),
  ('cs37', 'c6', 0, '06:00', '23:00', 0), ('cs38', 'c6', 1, '06:00', '23:00', 0),
  ('cs39', 'c6', 2, '06:00', '23:00', 0), ('cs40', 'c6', 3, '06:00', '23:00', 0),
  ('cs41', 'c6', 4, '06:00', '23:00', 0), ('cs42', 'c6', 5, '06:00', '23:00', 0),
  ('cs43', 'c6', 6, '06:00', '23:00', 0),
  ('cs44', 'c7', 0, '06:00', '23:00', 0), ('cs45', 'c7', 1, '06:00', '23:00', 0),
  ('cs46', 'c7', 2, '06:00', '23:00', 0), ('cs47', 'c7', 3, '06:00', '23:00', 0),
  ('cs48', 'c7', 4, '06:00', '23:00', 0), ('cs49', 'c7', 5, '06:00', '23:00', 0),
  ('cs50', 'c7', 6, '06:00', '23:00', 0),
  ('cs51', 'c8', 0, '06:00', '23:00', 0), ('cs52', 'c8', 1, '06:00', '23:00', 0),
  ('cs53', 'c8', 2, '06:00', '23:00', 0), ('cs54', 'c8', 3, '06:00', '23:00', 0),
  ('cs55', 'c8', 4, '06:00', '23:00', 0), ('cs56', 'c8', 5, '06:00', '23:00', 0),
  ('cs57', 'c8', 6, '06:00', '23:00', 0),
  ('cs58', 'c9', 0, '06:00', '23:00', 0), ('cs59', 'c9', 1, '06:00', '23:00', 0),
  ('cs60', 'c9', 2, '06:00', '23:00', 0), ('cs61', 'c9', 3, '06:00', '23:00', 0),
  ('cs62', 'c9', 4, '06:00', '23:00', 0), ('cs63', 'c9', 5, '06:00', '23:00', 0),
  ('cs64', 'c9', 6, '06:00', '23:00', 0),
  ('cs65', 'c10', 0, '06:00', '23:00', 0), ('cs66', 'c10', 1, '06:00', '23:00', 0),
  ('cs67', 'c10', 2, '06:00', '23:00', 0), ('cs68', 'c10', 3, '06:00', '23:00', 0),
  ('cs69', 'c10', 4, '06:00', '23:00', 0), ('cs70', 'c10', 5, '06:00', '23:00', 0),
  ('cs71', 'c10', 6, '06:00', '23:00', 0);

-- ── Credit Prices ───────────────────────────────────────────────────────────

INSERT INTO credit_prices (id, tenant_id, slot, day_type, price, effective_from, updated_by) VALUES
  -- IcaDemo
  ('cp1', 't1', 'morning',   'weekday', 1, '2026-01-01', 'u1'),
  ('cp2', 't1', 'afternoon', 'weekday', 2, '2026-01-01', 'u1'),
  ('cp3', 't1', 'evening',   'weekday', 3, '2026-01-01', 'u1'),
  ('cp4', 't1', 'morning',   'weekend', 2, '2026-01-01', 'u1'),
  ('cp5', 't1', 'afternoon', 'weekend', 3, '2026-01-01', 'u1'),
  ('cp6', 't1', 'evening',   'weekend', 3, '2026-01-01', 'u1'),
  -- LimaDemo
  ('cp7',  't2', 'morning',   'weekday', 2, '2026-01-01', 'u10'),
  ('cp8',  't2', 'afternoon', 'weekday', 3, '2026-01-01', 'u10'),
  ('cp9',  't2', 'evening',   'weekday', 4, '2026-01-01', 'u10'),
  ('cp10', 't2', 'morning',   'weekend', 3, '2026-01-01', 'u10'),
  ('cp11', 't2', 'afternoon', 'weekend', 4, '2026-01-01', 'u10'),
  ('cp12', 't2', 'evening',   'weekend', 5, '2026-01-01', 'u10');

-- ── Sample Bookings ─────────────────────────────────────────────────────────

INSERT INTO bookings (id, tenant_id, member_id, court_id, start_time, end_time, credits_deducted, status) VALUES
  -- IcaDemo — some past bookings
  ('b1', 't1', 'm1', 'c1', '2026-03-25T08:00:00', '2026-03-25T09:00:00', 1, 'completed'),
  ('b2', 't1', 'm1', 'c2', '2026-03-25T14:00:00', '2026-03-25T15:00:00', 2, 'completed'),
  ('b3', 't1', 'm2', 'c1', '2026-03-26T10:00:00', '2026-03-26T11:00:00', 1, 'completed'),
  ('b4', 't1', 'm1', 'c3', '2026-03-27T18:00:00', '2026-03-27T19:00:00', 3, 'completed'),
  -- IcaDemo — upcoming
  ('b5', 't1', 'm1', 'c1', '2026-03-29T09:00:00', '2026-03-29T10:00:00', 1, 'confirmed'),
  ('b6', 't1', 'm2', 'c2', '2026-03-29T16:00:00', '2026-03-29T17:00:00', 2, 'confirmed'),
  -- LimaDemo
  ('b7', 't2', 'm3', 'c5', '2026-03-28T10:00:00', '2026-03-28T11:00:00', 2, 'confirmed'),
  ('b8', 't2', 'm4', 'c8', '2026-03-28T18:00:00', '2026-03-28T19:00:00', 4, 'confirmed');

-- ── Credit Transactions ─────────────────────────────────────────────────────

INSERT INTO credit_transactions (id, tenant_id, member_id, amount, type, reason, booking_id, created_by) VALUES
  ('tx1', 't1', 'm1', 20,  'allocation',  'Asignacion mensual marzo', NULL, 'u1'),
  ('tx2', 't1', 'm1', -1,  'deduction',   'Reserva',                  'b1', 'u3'),
  ('tx3', 't1', 'm1', -2,  'deduction',   'Reserva',                  'b2', 'u3'),
  ('tx4', 't1', 'm1', -3,  'deduction',   'Reserva',                  'b4', 'u3'),
  ('tx5', 't1', 'm1', -1,  'deduction',   'Reserva',                  'b5', 'u3'),
  ('tx6', 't1', 'm2', 10,  'allocation',  'Asignacion mensual marzo', NULL, 'u1'),
  ('tx7', 't1', 'm2', -1,  'deduction',   'Reserva',                  'b3', 'u4'),
  ('tx8', 't1', 'm2', -2,  'deduction',   'Reserva',                  'b6', 'u4'),
  ('tx9', 't2', 'm3', 25,  'allocation',  'Asignacion mensual marzo', NULL, 'u10'),
  ('tx10','t2', 'm3', -2,  'deduction',   'Reserva',                  'b7', 'u12'),
  ('tx11','t2', 'm4', 15,  'allocation',  'Asignacion mensual marzo', NULL, 'u10'),
  ('tx12','t2', 'm4', -4,  'deduction',   'Reserva',                  'b8', 'u13');

-- ── Court Blocks ────────────────────────────────────────────────────────────

INSERT INTO court_blocks (id, court_id, date, start_time, end_time, reason, created_by) VALUES
  ('cb1', 'c3', '2026-03-31', NULL,    NULL,    'Mantenimiento programado', 'u1'),
  ('cb2', 'c5', '2026-04-01', '12:00', '14:00', 'Evento privado',          'u10');
