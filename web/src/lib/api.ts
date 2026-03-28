/**
 * API client for CanchaPro backend
 * Singleton with lazy token resolution from Zustand persisted store.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getAuthFromStorage(): { token: string | null; tenantId: string | null } {
  try {
    const raw = localStorage.getItem("canchapro-auth");
    if (!raw) return { token: null, tenantId: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.state?.token ?? null,
      tenantId: parsed?.state?.tenantId ?? null,
    };
  } catch {
    return { token: null, tenantId: null };
  }
}

class ApiClient {
  private _token: string | null = null;
  private _tenantId: string | null = null;

  setToken(token: string | null) { this._token = token; }
  setTenantId(tenantId: string | null) { this._tenantId = tenantId; }

  private getToken(): string | null {
    if (this._token) return this._token;
    // Fallback: read from localStorage if Zustand hasn't rehydrated yet
    const stored = getAuthFromStorage();
    if (stored.token) {
      this._token = stored.token;
      this._tenantId = stored.tenantId;
    }
    return this._token;
  }

  private getTenantId(): string | null {
    if (this._tenantId) return this._tenantId;
    const stored = getAuthFromStorage();
    return stored.tenantId;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    const tenantId = this.getTenantId();

    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["x-tenant-id"] = tenantId;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this._token = null;
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const json = await res.json();

    if (!res.ok) {
      throw new ApiError(json.error ?? "Unknown error", res.status);
    }

    return json;
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }

  async upload(path: string, file: File): Promise<{ data: { key: string; url: string } }> {
    const headers: Record<string, string> = {};
    const token = this.getToken();
    const tenantId = this.getTenantId();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["x-tenant-id"] = tenantId;

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
