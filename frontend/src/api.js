const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '' && value !== 'all') qs.set(key, value)
    })
    const query = qs.toString()
    return request(`/products${query ? `?${query}` : ''}`)
  },
  getProductsByCategory: () => request('/products/by-category'),
  getCategories: () => request('/categories'),
  createProduct: (body) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getCustomers: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') qs.set(key, value)
    })
    const query = qs.toString()
    return request(`/customers${query ? `?${query}` : ''}`)
  },
  createCustomer: (body) =>
    request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  getSales: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '' && value !== 'all') qs.set(key, value)
    })
    const query = qs.toString()
    return request(`/sales${query ? `?${query}` : ''}`)
  },
  getSaleStats: () => request('/sales/stats'),
  getTopProducts: () => request('/sales/top-products'),
  createSale: (body) => request('/sales', { method: 'POST', body: JSON.stringify(body) }),
  updateSaleStatus: (id, status) =>
    request(`/sales/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  getDashboardStats: () => request('/dashboard/stats'),
}
