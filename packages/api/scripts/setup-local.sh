#!/bin/bash
# CanchaPro local development setup
# Run from repo root: bash packages/api/scripts/setup-local.sh

set -e

echo "=== CanchaPro Local Setup ==="
echo ""

API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$API_DIR"

# 1. Run schema migration
echo "1/3 Running migrations..."
npx wrangler d1 migrations apply canchapro-db --local
echo "  Done."

# 2. Generate seed with real password hashes and apply
echo "2/3 Seeding database..."
node scripts/generate-seed.mjs > /tmp/canchapro-seed.sql
npx wrangler d1 execute canchapro-db --local --file=/tmp/canchapro-seed.sql
rm /tmp/canchapro-seed.sql
echo "  Done."

# 3. Verify
echo "3/3 Verifying..."
npx wrangler d1 execute canchapro-db --local --command="SELECT id, email, role FROM users"
echo ""
echo "=== Setup complete ==="
echo ""
echo "Start development:"
echo "  Terminal 1: pnpm dev:api    (API on http://localhost:8787)"
echo "  Terminal 2: pnpm dev:web    (Web on http://localhost:5173)"
echo ""
echo "Or run both:  pnpm dev"
echo ""
echo "Login credentials (all passwords: admin123):"
echo "  Platform admin: admin@lumini.dev"
echo "  Club admin:     admin@icapc.com"
echo "  Staff:          staff@icapc.com"
echo "  Member:         socio@icapc.com"
