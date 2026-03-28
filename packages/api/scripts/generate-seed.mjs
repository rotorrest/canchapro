#!/usr/bin/env node
/**
 * Generates seed SQL with PBKDF2 password hashes.
 * Run: node scripts/generate-seed.mjs > /tmp/seed.sql
 * All passwords: admin123
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pbkdf2Sync, randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const password = "admin123";
const ITERATIONS = 100_000;
const KEY_BYTES = 32;

const userIds = ["u0", "u1", "u2", "u3", "u4", "u10", "u11", "u12", "u13"];

function hashPBKDF2(pw) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pw, salt, ITERATIONS, KEY_BYTES, "sha256");
  return `pbkdf2:${ITERATIONS}:${salt.toString("base64")}:${hash.toString("base64")}`;
}

let sql = readFileSync(join(__dirname, "..", "migrations", "0002_seed.sql"), "utf8");

for (const id of userIds) {
  sql = sql.replace("__SEED_HASH__", hashPBKDF2(password));
}

if (sql.includes("__SEED_HASH__")) {
  console.error("ERROR: not all __SEED_HASH__ replaced. Check userIds array.");
  process.exit(1);
}

process.stdout.write(sql);
