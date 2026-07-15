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
    listMy: () => fetchApi('/products/my'),
    get: (slug: string) => fetchApi(`/products/${slug}`),
    create: (data: Record<string, unknown>) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchApi(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStock: (id: string, stock: number) => fetchApi(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
    delete: (id: string) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => fetchApi('/categories'),
  },
  cart: {
    get: () => fetchApi('/cart'),
    add: (data: { productId: string; quantity?: number }) => fetchApi('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (productId: string, quantity: number) => fetchApi(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    remove: (productId: string) => fetchApi(`/cart/items/${productId}`, { method: 'DELETE' }),
  },
  orders: {
    create: (data: { shippingAddress: Record<string, string> }) => fetchApi('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: () => fetchApi('/orders'),
    get: (id: string) => fetchApi(`/orders/${id}`),
    updateStatus: (id: string, status: string) => fetchApi(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  wishlist: {
    get: () => fetchApi('/wishlist'),
    add: (productId: string) => fetchApi(`/wishlist/${productId}`, { method: 'POST' }),
    remove: (productId: string) => fetchApi(`/wishlist/${productId}`, { method: 'DELETE' }),
  },
  coupons: {
    list: () => fetchApi('/coupons'),
    create: (data: Record<string, unknown>) => fetchApi('/coupons', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchApi(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/coupons/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    platform: () => fetchApi('/analytics/platform'),
    vendor: () => fetchApi('/analytics/vendor'),
  },
  search: {
    products: (q: string, params?: Record<string, string>) => fetchApi(`/search/products?q=${encodeURIComponent(q)}&${new URLSearchParams(params).toString()}`),
  },
  ai: {
    productDescription: (body: { name: string; category?: string; keywords?: string[] }) => fetchApi('/ai/product-description', { method: 'POST', body: JSON.stringify(body) }),
    salesInsights: () => fetchApi('/ai/sales-insights'),
    recommendations: () => fetchApi('/ai/recommendations'),
  },
  admin: {
    users: (params?: Record<string, string>) => fetchApi(`/admin/users?${new URLSearchParams(params).toString()}`),
    updateRole: (id: string, role: string) => fetchApi(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    pendingVendors: () => fetchApi('/admin/vendors/pending'),
    verifyVendor: (id: string) => fetchApi(`/admin/vendors/${id}/verify`, { method: 'PATCH' }),
    products: () => fetchApi('/admin/products'),
    suspendProduct: (id: string) => fetchApi(`/admin/products/${id}/suspend`, { method: 'PATCH' }),
    updateCommission: (id: string, commissionRate: number) => fetchApi(`/admin/vendors/${id}/commission`, { method: 'PATCH', body: JSON.stringify({ commissionRate }) }),
  },
};
