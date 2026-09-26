export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface UserStats {
  total_subjects: number;
  total_resources: number;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  resource_count?: number;
}

export interface Resource {
  id: string;
  subject_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  subject_name?: string;
}

export interface SearchResults {
  subjects: Subject[];
  resources: Resource[];
}

const TOKEN_KEY = "acadnote_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(data: { name: string; email: string; password: string; confirmPassword: string }) {
      const res = await request<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setToken(res.token);
      return res;
    },

    async login(data: { email: string; password: string }) {
      const res = await request<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setToken(res.token);
      return res;
    },

    async getMe() {
      return request<{ user: User; stats: UserStats }>("/api/auth/me");
    },

    async updateProfile(name: string) {
      return request<{ user: User }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
    },

    logout() {
      removeToken();
    },
  },

  subjects: {
    async list() {
      const res = await request<{ subjects: Subject[] }>("/api/subjects");
      return res.subjects;
    },

    async create(data: { name: string; description?: string }) {
      const res = await request<{ subject: Subject }>("/api/subjects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.subject;
    },

    async get(id: string) {
      return request<{ subject: Subject; resources: Resource[] }>(`/api/subjects/${id}`);
    },

    async delete(id: string) {
      return request<{ success: boolean; message: string }>(`/api/subjects/${id}`, {
        method: "DELETE",
      });
    },
  },

  resources: {
    async upload(subjectId: string, file: File, onProgress?: (percentage: number) => void): Promise<{ resource: Resource }> {
      const token = getToken();
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/subjects/${subjectId}/resources`);

        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
            }
          } catch {
            reject(new Error("Failed to parse upload response"));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during upload. Please try again."));
        };

        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });
    },

    async getRecent(limit = 6) {
      const res = await request<{ resources: Resource[] }>(`/api/resources/recent?limit=${limit}`);
      return res.resources;
    },

    async delete(id: string) {
      return request<{ success: boolean; message: string }>(`/api/resources/${id}`, {
        method: "DELETE",
      });
    },

    getViewUrl(id: string): string {
      const token = getToken();
      return `/api/resources/${id}/view${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    },

    getDownloadUrl(id: string): string {
      const token = getToken();
      return `/api/resources/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    },
  },

  search: {
    async query(q: string): Promise<SearchResults> {
      return request<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`);
    },
  },
};
