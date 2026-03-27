/**
 * API client for CanchaPro backend
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const { data } = await api.get("/v1/courts");
 *   const { data } = await api.post("/v1/bookings", { courtId, startTime, endTime });
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

class ApiClient {
  private token: string | null = null;
  private tenantId: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers["x-tenant-id"] = this.tenantId;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      // Token expired — clear auth and redirect
      this.token = null;
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const json = await res.json();

    if (!res.ok) {
      throw new ApiError(json.error ?? "Unknown error", res.status);
    }

    return json;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  async upload(path: string, file: File): Promise<{ data: { key: string; url: string } }> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (this.tenantId) headers["x-tenant-id"] = this.tenantId;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const json = await res.json();
      throw new ApiError(json.error ?? "Upload failed", res.status);
    }

    return res.json();
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();
