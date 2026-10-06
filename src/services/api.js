// Vazio por padrão: a API é servida no mesmo domínio (proxy do Vite localmente,
// função serverless na Vercel). VITE_API_URL permite apontar para outro servidor.
const API_URL = import.meta.env.VITE_API_URL || '';

let accessToken = sessionStorage.getItem('cursolab_access_token');
let refreshToken = sessionStorage.getItem('cursolab_refresh_token');
let refreshPromise = null;

export const setAccessToken = (token, nextRefreshToken = null) => {
  accessToken = token;
  if (token) sessionStorage.setItem('cursolab_access_token', token);
  else sessionStorage.removeItem('cursolab_access_token');

  if (nextRefreshToken) {
    refreshToken = nextRefreshToken;
    sessionStorage.setItem('cursolab_refresh_token', nextRefreshToken);
  } else if (!token) {
    refreshToken = null;
    sessionStorage.removeItem('cursolab_refresh_token');
  }
};

const refreshSession = async () => {
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const body = await response.json();

        if (!response.ok || !body.accessToken || !body.refreshToken) {
          setAccessToken(null);
          return false;
        }

        setAccessToken(body.accessToken, body.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => { refreshPromise = null; });
  }

  return refreshPromise;
};

const request = async (path, options = {}, retriedAfterRefresh = false) => {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (accessToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (response.status === 401 && !retriedAfterRefresh && path !== '/api/auth/refresh' && await refreshSession()) {
    return request(path, options, true);
  }

  if (!response.ok) {
    const error = new Error(body?.error || 'Não foi possível concluir a operação.');
    error.status = response.status;
    throw error;
  }
  return body;
};

export const api = {
  getCourses: () => request('/api/courses'),
  getAdminAnalytics: () => request('/api/admin/analytics'),
  getCourseContent: (courseId) => request(`/api/courses/${courseId}/content`),
  getCourseProgress: (courseId) => request(`/api/courses/${courseId}/progress`),
  setLessonProgress: (lessonId, completed) => request(`/api/lessons/${lessonId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  }),
  getProfile: () => request('/api/students/me'),
  getEnrollments: () => request('/api/enrollments/me'),
  enroll: (courseId) => request('/api/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) }),
  getMySupportTickets: () => request('/api/support-tickets/me'),
  createSupportTicket: (ticket) => request('/api/support-tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  getAdminSupportTickets: () => request('/api/admin/support-tickets'),
  updateAdminSupportTicket: (ticketId, ticket) => request(`/api/admin/support-tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify(ticket) }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (fullName, email, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password }) }),
  requestPasswordRecovery: (email) => request('/api/auth/password-recovery', { method: 'POST', body: JSON.stringify({ email }) }),
  exchangeRecoveryCode: (code) => request('/api/auth/recovery-session', { method: 'POST', body: JSON.stringify({ code }) }),
  updatePassword: (password, recoveryToken) => request('/api/auth/update-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${recoveryToken}` },
    body: JSON.stringify({ password }),
  }),
  createCourse: (course) => request('/api/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (courseId, course) => request(`/api/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(course) }),
  deleteCourse: (courseId) => request(`/api/courses/${courseId}`, { method: 'DELETE' }),
};
