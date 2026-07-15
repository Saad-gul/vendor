const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchApi(input: string, init?: RequestInit) {
  const url = `${API_URL}${input}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || 'Something went wrong');
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchApi('/auth/me'),
    logout: (refreshToken: string) => fetchApi('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  },
  products: {
    list: (params?: Record<string, string>) => fetchApi(`/products?${new URLSearchParams(params).toString()}`),
    get: (slug: string) => fetchApi(`/products/${slug}`),
  },
  categories: {
    list: () => fetchApi('/categories'),
  },
  cart: {
    get: () => fetchApi('/cart'),
    add: (data: { productId: string; quantity?: number }) => fetchApi('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  },
  orders: {
    create: (data: { shippingAddress: Record<string, string> }) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: () => fetchApi('/orders'),
  },
  analytics: {
    platform: () => fetchApi('/analytics/platform'),
    vendor: () => fetchApi('/analytics/vendor'),
  },
};
