export const API_BASE = "http://localhost:5000/api";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;

  const baseOptions: RequestInit = {
    credentials: "include", // cookies (access/refresh) are sent automatically
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  let res = await fetch(url, baseOptions);

  // If unauthorized, attempt refresh once
  if (res.status === 401) {
    const refresh = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      // refresh succeeded -> retry original request
      res = await fetch(url, baseOptions);
    } else {
      // refresh failed -> session expired
      const err = await safeJson(refresh);
      throw new Error(err?.message || "Session expired");
    }
  }

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || `API error ${res.status}`);
  }

  return safeJson(res);
}
