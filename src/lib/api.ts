import { useAuthStore } from './store';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const { accessToken, logout } = useAuthStore.getState();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    logout();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body: any) => fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => fetchApi('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => fetchApi('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  get2FASetup: () => fetchApi('/api/auth/two-factor'),
  enable2FA: (code: string) => fetchApi('/api/auth/two-factor', { method: 'POST', body: JSON.stringify({ code }) }),

  // Broker
  connectBroker: (body: any) => fetchApi('/api/broker/connect', { method: 'POST', body: JSON.stringify(body) }),
  getBrokerAccounts: () => fetchApi('/api/broker/accounts'),
  disconnectBroker: (id: string) => fetchApi(`/api/broker/disconnect`, { method: 'POST', body: JSON.stringify({ id }) }),

  // Bot
  startBot: (body: any) => fetchApi('/api/bot/start', { method: 'POST', body: JSON.stringify(body) }),
  stopBot: (brokerAccountId: string) => fetchApi('/api/bot/stop', { method: 'POST', body: JSON.stringify({ brokerAccountId }) }),
  getBotStrategies: () => fetchApi('/api/bot/strategies'),
  getBotInstances: () => fetchApi('/api/bot/instances'),

  // Payments
  createCheckout: (plan: string) => fetchApi('/api/payments/create-checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  getSubscription: () => fetchApi('/api/payments/subscription'),
  getInvoices: () => fetchApi('/api/payments/invoices'),

  // Admin
  adminGetUsers: () => fetchApi('/api/admin/users'),
  adminGetBots: () => fetchApi('/api/admin/bot-control'),
  adminControlBot: (body: any) => fetchApi('/api/admin/bot-control', { method: 'POST', body: JSON.stringify(body) }),
  adminGetCommissions: () => fetchApi('/api/admin/commissions'),
  adminChargeCommission: (body: any) => fetchApi('/api/admin/commissions', { method: 'POST', body: JSON.stringify(body) }),
};
