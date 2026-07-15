import type {
  ApiKeyStatus,
  AuthResponse,
  ChatResponse,
  ChatHistoryResponse,
  MemoriesResponse,
  MemoryDetail,
  SignInRequest,
  SignUpRequest,
  TokenResponse,
  User,
  ValidateApiKeyResponse
} from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

class ContextMemoryAPI {
  private getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders(),
        ...(options?.headers as Record<string, string> | undefined)
      } satisfies Record<string, string>,
      ...options
    });

    if (response.status === 401 && retry && (await this.refreshToken())) {
      return this.request<T>(path, options, false);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body.detail;
      if (detail?.code === "API_KEY_REQUIRED") {
        throw new Error("API_KEY_REQUIRED");
      }
      throw new Error(typeof detail === "string" ? detail : body.message ?? body.error ?? `Request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  hasStoredTokens() {
    return Boolean(this.getAccessToken());
  }

  async signUp(data: SignUpRequest) {
    const response = await this.request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data)
    }, false);
    this.setTokens(response.access_token, response.refresh_token);
    return normalizeUser(response.user);
  }

  async signIn(data: SignInRequest) {
    const response = await this.request<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(data)
    }, false);
    this.setTokens(response.access_token, response.refresh_token);
    return normalizeUser(response.user);
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    try {
      await this.request("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken })
      }, false);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      this.clearTokens();
      return false;
    }

    const body = (await response.json()) as TokenResponse;
    localStorage.setItem(ACCESS_TOKEN_KEY, body.access_token);
    return true;
  }

  async getCurrentUser() {
    if (!this.getAccessToken()) {
      return null;
    }
    const user = await this.request<User | null>("/api/auth/me");
    return user ? normalizeUser(user) : null;
  }

  getApiKeyStatus() {
    return this.request<ApiKeyStatus>("/api/api-keys/status");
  }

  validateApiKey(apiKey: string) {
    return this.request<ValidateApiKeyResponse>("/api/api-keys/validate", {
      method: "POST",
      body: JSON.stringify({ api_key: apiKey })
    });
  }

  storeApiKey(apiKey: string) {
    return this.request<{ message: string }>("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ api_key: apiKey })
    });
  }

  deleteApiKey() {
    return this.request<{ message: string }>("/api/api-keys", { method: "DELETE" });
  }

  chat(message: string) {
    return this.request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message })
    });
  }

  getChatHistory(limit = 100, offset = 0) {
    return this.request<ChatHistoryResponse>(`/api/chat/history?limit=${limit}&offset=${offset}`);
  }

  clearChatHistory() {
    return this.request<{ message: string }>("/api/chat/history", { method: "DELETE" });
  }

  getMemories() {
    return this.request<MemoriesResponse>("/api/memories");
  }

  getMemoryDetail(memoryId: number) {
    return this.request<MemoryDetail>(`/api/memory/${memoryId}`);
  }

  deleteMemory(memoryId: number) {
    return this.request<{ status: string; id: number; deletedMemoryId: number }>(`/api/memory/${memoryId}`, { method: "DELETE" });
  }
}

function normalizeUser(user: User): User {
  return {
    ...user,
    is_active: user.is_active ?? true,
    usage: {
      ...user.usage,
      message_count: user.usage.message_count ?? user.usage.free_message_limit - user.usage.free_messages_remaining
    }
  };
}

export const api = new ContextMemoryAPI();
