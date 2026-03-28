#!/usr/bin/env node
/**
 * Generates the seed SQL with real password hashes.
 * Run: node scripts/generate-seed.mjs > migrations/0002_seed_local.sql
 *
 * All passwords: admin123
 */
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const password = "admin123";

const userIds = ["u0", "u1", "u2", "u3", "u10", "u11", "u12"];

function hash(pw, salt) {
  return createHash("sha256").update(pw + salt).digest("base64");
}

let sql = readFileSync(join(__dirname, "..", "migrations", "0002_seed.sql"), "utf8");

for (const id of userIds) {
  sql = sql.replace("__SEED_HASH__", hash(password, id));
}

process.stdout.write(sql);
