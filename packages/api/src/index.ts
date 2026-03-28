import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./types";
import { tenantMiddleware } from "./middleware/tenant";
import auth from "./routes/auth";
import courts from "./routes/courts";
import bookings from "./routes/bookings";
import members from "./routes/members";
import site from "./routes/site";
import platform from "./routes/platform";
import marketplace from "./routes/marketplace";
import sedes from "./routes/sedes";
import notificationConsumer from "./queue/notifications";
import scheduledHandler from "./cron/scheduled";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global middleware
app.use("/*", logger());
app.use("/*", cors({
  origin: (origin) => {
    // In dev, allow all origins. In production, restrict via env check.
    // Since cors() origin callback doesn't receive context, we allow all
    // and rely on Cloudflare WAF + rate limiting for production security.
    return origin;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
  maxAge: 86400,
}));
app.use("/*", tenantMiddleware);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/v1/auth", auth);
app.route("/v1/courts", courts);
app.route("/v1/bookings", bookings);
app.route("/v1/members", members);
app.route("/v1/site", site);
app.route("/v1/platform", platform);
app.route("/v1/marketplace", marketplace);
app.route("/v1/sedes", sedes);

// 404
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// Export with queue consumer and cron trigger
export default {
  fetch: app.fetch,
  queue: notificationConsumer.queue,
  scheduled: scheduledHandler.scheduled,
};
