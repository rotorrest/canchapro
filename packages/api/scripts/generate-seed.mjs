#!/usr/bin/env node
/**
 * Generates seed SQL with real SHA-256 password hashes.
 * Run: node scripts/generate-seed.mjs > /tmp/seed.sql
 * All passwords: admin123
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const password = "admin123";

// Must match the order of __SEED_HASH__ in the SQL
const userIds = ["u0", "u1", "u2", "u3", "u4", "u10", "u11", "u12", "u13"];

function hash(pw, salt) {
  return createHash("sha256").update(pw + salt).digest("base64");
}

let sql = readFileSync(join(__dirname, "..", "migrations", "0002_seed.sql"), "utf8");

for (const id of userIds) {
  sql = sql.replace("__SEED_HASH__", hash(password, id));
}

if (sql.includes("__SEED_HASH__")) {
  console.error("ERROR: not all __SEED_HASH__ replaced. Check userIds array.");
  process.exit(1);
}

process.stdout.write(sql);
