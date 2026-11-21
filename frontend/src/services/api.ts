import axios from 'axios';
import {
  AuthResponse,
  User,
  RFQ,
  Quotation,
  RFQRankings,
  ActivityLog,
  DashboardStats,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    company_name?: string;
    contact_phone?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const rfqAPI = {
  list: async (status?: string, search?: string): Promise<RFQ[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    if (search) params.search = search;
    const res = await api.get<RFQ[]>('/rfqs', { params });
    return res.data;
  },
  getById: async (id: number): Promise<RFQ> => {
    const res = await api.get<RFQ>(`/rfqs/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<RFQ> => {
    const res = await api.post<RFQ>('/rfqs', data);
    return res.data;
  },
};

export const biddingAPI = {
  getBids: async (rfqId: number): Promise<Quotation[]> => {
    const res = await api.get<Quotation[]>(`/rfqs/${rfqId}/bids`);
    return res.data;
  },
  submitBid: async (
    rfqId: number,
    data: {
      carrier_name: string;
      freight_charges: number;
      origin_charges: number;
      destination_charges: number;
      transit_time: string;
      quote_validity: string;
    }
  ) => {
    const res = await api.post(`/rfqs/${rfqId}/bids`, data);
    return res.data;
  },
};

export const rankingAPI = {
  getRankings: async (rfqId: number): Promise<RFQRankings> => {
    const res = await api.get<RFQRankings>(`/rfqs/${rfqId}/rankings`);
    return res.data;
  },
};

export const activityAPI = {
  getLogs: async (rfqId: number): Promise<ActivityLog[]> => {
    const res = await api.get<ActivityLog[]>(`/rfqs/${rfqId}/activity`);
    return res.data;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

export default api;
