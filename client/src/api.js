const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  dashboard: {
    get: () => request('/dashboard'),
  },
  tutors: {
    list: () => request('/tutors'),
    get: (id) => request(`/tutors/${id}`),
    create: (data) => request('/tutors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tutors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/tutors/${id}`, { method: 'DELETE' }),
  },
  students: {
    list: () => request('/students'),
    get: (id) => request(`/students/${id}`),
    create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    list: (params) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/sessions${query}`);
    },
    get: (id) => request(`/sessions/${id}`),
    create: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  },
  subjects: {
    list: () => request('/subjects'),
    get: (id) => request(`/subjects/${id}`),
    create: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  },
  clients: {
    list: () => request('/clients'),
    get: (id) => request(`/clients/${id}`),
    create: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  },
};
