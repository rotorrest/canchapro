/**
 * Run with: npx tsx scripts/generate-seed-hashes.ts
 * Generates SHA-256 password hashes for seed data users.
 * Copy the output SQL to replace __SEED_HASH__ in 0002_seed.sql
 */

const users = [
  { id: "u0", email: "admin@lumini.dev" },
  { id: "u1", email: "admin@icapc.com" },
  { id: "u2", email: "staff@icapc.com" },
  { id: "u3", email: "socio@icapc.com" },
  { id: "u10", email: "admin@limacp.com" },
  { id: "u11", email: "staff@limacp.com" },
  { id: "u12", email: "socio@limacp.com" },
];

const password = "admin123";

async function main() {
  for (const u of users) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + u.id);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    console.log(`-- ${u.email}`);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE id = '${u.id}';`);
  }
}

main();
