 // --- API BASE: BEGIN ---
// IMPORTANT: Update BASE_URL and endpoints to match your backend deployment if different
export const API_BASE_URL = "/api";
// --- API BASE: END ---

export type User = {
  id: string;
  email: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Folder = {
  id: string;
  name: string;
};

type AuthResult =
  | { status: "success"; user: User }
  | { status: "error"; error: string };

type FetchOptions = RequestInit & { requireAuth?: boolean; };

export class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("ACCESS_TOKEN");
  }
  private storeToken(token: string) {
    localStorage.setItem("ACCESS_TOKEN", token);
  }
  private clearToken() {
    localStorage.removeItem("ACCESS_TOKEN");
  }

  async request<T = any>(
    path: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const url = API_BASE_URL + path;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Only spread if it's a POJO; handle Headers, arrays, etc. safely
    if (options.headers) {
      if (typeof (options.headers as any).forEach === "function" && typeof (options.headers as any).entries === "function") {
        // Looks like a Headers instance
        (options.headers as any).forEach((v: string, k: string) => {
          headers[k] = v;
        });
      } else {
        headers = {
          ...headers,
          ...options.headers as Record<string, string>,
        };
      }
    }
    if (options.requireAuth && this.getToken()) {
      headers["Authorization"] = "Bearer " + this.getToken();
    }
    const resp = await fetch(url, {
      ...options,
      headers,
    });
    if (!resp.ok) {
      throw new Error((await resp.json()).error || "Request failed");
    }
    return resp.json();
  }

  /* --- AUTH --- */

  // PUBLIC_INTERFACE
  async signup(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await this.request<{token: string; user: User}>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
      this.storeToken(result.token);
      return { status: "success", user: result.user };
    } catch (e: any) {
      return { status: "error", error: e?.message || "Signup failed" };
    }
  }
  // PUBLIC_INTERFACE
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await this.request<{token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
      this.storeToken(result.token);
      return { status: "success", user: result.user };
    } catch (e: any) {
      return { status: "error", error: e?.message || "Login failed" };
    }
  }
  // PUBLIC_INTERFACE
  async logout() {
    this.clearToken();
  }
  // PUBLIC_INTERFACE
  async getUser(): Promise<User | null> {
    try {
      return await this.request<User>("/auth/me", { requireAuth: true });
    } catch {
      return null;
    }
  }

  /* --- FOLDERS --- */

  // PUBLIC_INTERFACE
  async getFolders(): Promise<Folder[]> {
    return await this.request<Folder[]>("/folders", { requireAuth: true });
  }
  // PUBLIC_INTERFACE
  async createFolder(name: string): Promise<Folder> {
    return await this.request<Folder>("/folders", {
      method: "POST",
      body: JSON.stringify({ name }),
      requireAuth: true,
    });
  }

  /* --- NOTES --- */

  // PUBLIC_INTERFACE
  async getNotes(folderId: string = "", search: string = ""): Promise<Note[]> {
    const params = new URLSearchParams();
    if (folderId) params.set("folderId", folderId);
    if (search) params.set("search", search);
    return await this.request<Note[]>(
      `/notes?${params.toString()}`,
      { requireAuth: true }
    );
  }
  // PUBLIC_INTERFACE
  async getNote(noteId: string): Promise<Note> {
    return await this.request<Note>(`/notes/${noteId}`, { requireAuth: true });
  }
  // PUBLIC_INTERFACE
  async createNote(note: Partial<Note>): Promise<Note> {
    return await this.request<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(note),
      requireAuth: true,
    });
  }
  // PUBLIC_INTERFACE
  async updateNote(noteId: string, note: Partial<Note>): Promise<Note> {
    return await this.request<Note>(`/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(note),
      requireAuth: true,
    });
  }
  // PUBLIC_INTERFACE
  async deleteNote(noteId: string) {
    return await this.request(`/notes/${noteId}`, {
      method: "DELETE",
      requireAuth: true,
    });
  }
}

export const globalApiClient = new ApiClient();
