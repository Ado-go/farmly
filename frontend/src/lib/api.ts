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

  const isFormData = options.body instanceof FormData;

  const baseOptions: RequestInit = {
    credentials: "include", // cookies (access/refresh)
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  };

  if (baseOptions.body && !isFormData && typeof baseOptions.body !== "string") {
    baseOptions.body = JSON.stringify(baseOptions.body);
  }

  let res = await fetch(url, baseOptions);

  // If unauthorized, attempt refresh once
  if (res.status === 401) {
    const refresh = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      res = await fetch(url, baseOptions);
    } else {
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
