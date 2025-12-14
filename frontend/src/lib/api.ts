export const API_BASE = import.meta.env.VITE_API_BASE;

type PlainObject = Record<string, unknown>;
type BodyPayload = BodyInit | PlainObject;
type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyPayload;
  skipAuthRefresh?: boolean;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: ApiRequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const { skipAuthRefresh, ...fetchOptions } = options;

  const isFormData = fetchOptions.body instanceof FormData;
  const isPlainObject = (
    value: BodyPayload | undefined
  ): value is PlainObject =>
    !!value &&
    typeof value === "object" &&
    value.constructor === Object &&
    !(value instanceof FormData);

  const preparedBody: BodyInit | undefined = isPlainObject(fetchOptions.body)
    ? JSON.stringify(fetchOptions.body)
    : fetchOptions.body;

  const baseOptions: RequestInit = {
    credentials: "include", // cookies (access/refresh)
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(fetchOptions.headers || {}),
    },
    ...fetchOptions,
    body: preparedBody,
  };

  let res = await fetch(url, baseOptions);

  // If unauthorized, attempt refresh once (unless explicitly skipped)
  if (res.status === 401 && !skipAuthRefresh) {
    const refresh = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refresh.ok) {
      res = await fetch(url, baseOptions);
    } else {
      const err = await safeJson(refresh);
      throw new Error(err?.message || err?.error || "Session expired");
    }
  }

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message || err?.error || `API error ${res.status}`);
  }

  return safeJson(res);
}
