import { useBoot } from './useBoot';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function useRequest() {
  const { restUrl, nonce } = useBoot();

  const call = async <T>(path: string, method: Method = 'GET', body?: unknown, extra?: RequestInit): Promise<T> => {
    const response = await fetch(`${restUrl}${path}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
        ...(extra?.headers || {})
      },
      ...extra
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  };

  return { call };
}
