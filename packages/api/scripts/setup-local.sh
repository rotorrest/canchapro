#!/bin/bash
# CanchaPro local development setup
# Run from repo root: bash packages/api/scripts/setup-local.sh
set -e

API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$API_DIR"

echo "=== CanchaPro Local Setup ==="
echo ""

# 1. Reset D1 state
echo "1/3 Resetting local database..."
rm -rf .wrangler/state
echo "  Done."

# 2. Apply schema (not seed — seed has __SEED_HASH__ placeholders)
echo "2/3 Applying schema + seed with PBKDF2 hashes..."
npx wrangler d1 execute canchapro-db --local --file=migrations/0001_init.sql 2>/dev/null
node scripts/generate-seed.mjs > /tmp/canchapro-seed.sql
npx wrangler d1 execute canchapro-db --local --file=/tmp/canchapro-seed.sql 2>/dev/null
rm /tmp/canchapro-seed.sql
echo "  Done."

# 3. Verify
echo "3/3 Verifying..."
npx wrangler d1 execute canchapro-db --local --command="SELECT id, email, role, substr(password_hash,1,15) as hash_fmt FROM users LIMIT 3" 2>/dev/null | grep -E "id|email|role|hash_fmt" | head -12
echo ""
echo "=== Setup complete ==="
echo ""
echo "Start development:"
echo "  pnpm dev:api    (API on http://localhost:8787)"
echo "  pnpm dev:web    (Web on http://localhost:5173)"
echo "  pnpm dev        (both in parallel)"
echo ""
echo "Accounts (password: admin123):"
echo "  Platform:  admin@lumini.dev"
echo "  IcaDemo:   admin@icademo.com / staff@icademo.com / socio1@icademo.com"
echo "  LimaDemo:  admin@limademo.com / staff@limademo.com / socio1@limademo.com"
