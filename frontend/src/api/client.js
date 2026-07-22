const BASE_URL = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // fetch() itself throws on network failure (no connection, DNS, etc.) --
    // give a clearer message than the browser's raw "Failed to fetch" so a
    // field user on a bad connection knows what happened.
    throw new Error(
      navigator.onLine === false
        ? 'You appear to be offline. Reconnect and try again.'
        : "Couldn't reach the server. Check your connection and try again."
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // ignore parse errors on empty/non-json bodies
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  orders: {
    list: (params = {}) => {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
      const qs = query.toString();
      return request(`/orders${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/orders/${id}`),
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  },
  customers: {
    list: () => request('/customers'),
    get: (id) => request(`/customers/${id}`),
    create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  dashboard: {
    summary: () => request('/dashboard/summary'),
    trend: () => request('/dashboard/trend'),
  },
  vat: {
    summary: (params = {}) => {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
      const qs = query.toString();
      return request(`/vat${qs ? `?${qs}` : ''}`);
    },
  },
};
