export async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${l4pApp.root}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': l4pApp.nonce,
      ...(options.headers || {})
    },
    credentials: 'same-origin',
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function sendJSON<T>(endpoint: string, method: string, body: Record<string, unknown>): Promise<T> {
  return fetchJSON<T>(endpoint, {
    method,
    body: JSON.stringify(body)
  });
}
