import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserDTO,
  ContactDTO,
  ContactGroupDTO,
  TemplateDTO,
  CampaignDTO,
  EmailDelivery,
  CampaignActivity,
  AnalyticsDTO,
  AdminDashboardData,
  SystemLog,
} from '../types';

const TOKEN_KEY = 'campaignpro_jwt_token';
const BACKEND_URL_KEY = 'campaignpro_backend_url';

const DEFAULT_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

function getInitialUrl(): string {
  const stored = localStorage.getItem(BACKEND_URL_KEY);
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/$/, '');
  }
  return DEFAULT_URL;
}

export class ApiService {
  private static baseUrl = getInitialUrl();

  public static getBaseUrl(): string {
    return this.baseUrl;
  }

  public static setBaseUrl(url: string): void {
    this.baseUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem(BACKEND_URL_KEY, this.baseUrl);
  }

  public static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const fullUrl = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;

    try {
      const res = await fetch(fullUrl, { ...options, headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status} ${res.statusText}`);
      }
      if (res.status === 204) return {} as T;
      const type = res.headers.get('content-type') || '';
      if (type.includes('application/json')) {
        return await res.json();
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text as unknown as T;
      }
    } catch (err: any) {
      if (this.baseUrl && (err.message?.includes('Failed to fetch') || err.name === 'TypeError')) {
        const proxyRes = await fetch(endpoint, { ...options, headers });
        if (!proxyRes.ok) {
          const errorData = await proxyRes.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${proxyRes.status}`);
        }
        if (proxyRes.status === 204) return {} as T;
        const type = proxyRes.headers.get('content-type') || '';
        if (type.includes('application/json')) {
          return await proxyRes.json();
        }
        const text = await proxyRes.text();
        try {
          return JSON.parse(text);
        } catch {
          return text as unknown as T;
        }
      }
      throw err;
    }
  }

  public static async testBackendConnection(customUrl?: string): Promise<{ ok: boolean; message: string; latency?: number }> {
    const targetUrl = (customUrl !== undefined ? customUrl : this.baseUrl).replace(/\/$/, '');
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const url = targetUrl ? `${targetUrl}/api/templates/default` : '/api/templates/default';

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latency = Math.round(performance.now() - startTime);

      if (res.ok || res.status === 401 || res.status === 403) {
        return { ok: true, message: `Connected (${res.status} ${res.statusText || 'OK'})`, latency };
      }
      return { ok: false, message: `Status ${res.status}` };
    } catch (err: any) {
      return {
        ok: false,
        message: err.name === 'AbortError' ? 'Connection timed out (>6s)' : (err.message || 'Cannot connect')
      };
    }
  }

  public static async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public static async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  public static async getProfile(): Promise<UserDTO> {
    return await this.request<UserDTO>('/api/users/profile');
  }

  public static async updateProfile(data: Partial<UserDTO>): Promise<UserDTO> {
    return await this.request<UserDTO>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public static async getAllUsers(): Promise<UserDTO[]> {
    const res = await this.request<UserDTO[]>('/api/users/all');
    return Array.isArray(res) ? res : [];
  }

  public static async updateUserRole(id: string, role: string): Promise<UserDTO> {
    return await this.request<UserDTO>(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  public static async updateUserStatus(id: string, active: boolean): Promise<UserDTO> {
    return await this.request<UserDTO>(`/api/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  }

  public static async deleteUser(id: string): Promise<void> {
    await this.request(`/api/users/${id}`, { method: 'DELETE' });
  }

  public static async getContacts(): Promise<ContactDTO[]> {
    const res = await this.request<ContactDTO[]>('/api/contacts');
    return Array.isArray(res) ? res : [];
  }

  public static async getContactById(id: string): Promise<ContactDTO> {
    return await this.request<ContactDTO>(`/api/contacts/${id}`);
  }

  public static async createContact(contact: Omit<ContactDTO, 'id' | 'userId'>): Promise<ContactDTO> {
    return await this.request<ContactDTO>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  public static async updateContact(id: string, contact: Partial<ContactDTO>): Promise<ContactDTO> {
    return await this.request<ContactDTO>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  public static async deleteContact(id: string): Promise<void> {
    await this.request(`/api/contacts/${id}`, { method: 'DELETE' });
  }

  public static async searchContacts(searchTerm: string): Promise<ContactDTO[]> {
    const res = await this.request<ContactDTO[]>(`/api/contacts/search?searchTerm=${encodeURIComponent(searchTerm)}`);
    return Array.isArray(res) ? res : [];
  }

  public static async getContactsByGroup(groupName: string): Promise<ContactDTO[]> {
    const res = await this.request<ContactDTO[]>(`/api/contacts/group/${encodeURIComponent(groupName)}`);
    return Array.isArray(res) ? res : [];
  }

  public static async getGroups(): Promise<ContactGroupDTO[]> {
    const res = await this.request<ContactGroupDTO[]>('/api/contacts/groups');
    return Array.isArray(res) ? res : [];
  }

  public static async createGroup(data: { name: string; description?: string }): Promise<ContactGroupDTO> {
    return await this.request<ContactGroupDTO>('/api/contacts/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateGroup(id: string, data: Partial<ContactGroupDTO>): Promise<ContactGroupDTO> {
    return await this.request<ContactGroupDTO>(`/api/contacts/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteGroup(id: string): Promise<void> {
    await this.request(`/api/contacts/groups/${id}`, { method: 'DELETE' });
  }

  public static async addContactToGroup(contactId: string, groupId: string): Promise<void> {
    await this.request(`/api/contacts/${contactId}/groups/${groupId}`, { method: 'POST' });
  }

  public static async removeContactFromGroup(contactId: string, groupId: string): Promise<void> {
    await this.request(`/api/contacts/${contactId}/groups/${groupId}`, { method: 'DELETE' });
  }

  public static async getTemplates(): Promise<TemplateDTO[]> {
    const res = await this.request<TemplateDTO[]>('/api/templates');
    return Array.isArray(res) ? res : [];
  }

  public static async getTemplateById(id: string): Promise<TemplateDTO> {
    return await this.request<TemplateDTO>(`/api/templates/${id}`);
  }

  public static async getDefaultTemplates(): Promise<TemplateDTO[]> {
    const res = await this.request<TemplateDTO[]>('/api/templates/default');
    return Array.isArray(res) ? res : [];
  }

  public static async createTemplate(data: { name: string; subject: string; body: string }): Promise<TemplateDTO> {
    return await this.request<TemplateDTO>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateTemplate(id: string, data: Partial<TemplateDTO>): Promise<TemplateDTO> {
    return await this.request<TemplateDTO>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteTemplate(id: string): Promise<void> {
    await this.request(`/api/templates/${id}`, { method: 'DELETE' });
  }

  public static async previewTemplate(id: string): Promise<string> {
    return await this.request<string>(`/api/templates/${id}/preview`);
  }

  public static async getCampaigns(): Promise<CampaignDTO[]> {
    const res = await this.request<CampaignDTO[]>('/api/campaigns');
    return Array.isArray(res) ? res : [];
  }

  public static async getCampaignById(id: string): Promise<CampaignDTO> {
    return await this.request<CampaignDTO>(`/api/campaigns/${id}`);
  }

  public static async createCampaign(data: {
    name: string;
    templateId?: string;
    contactIds?: string[];
    groupIds?: string[];
    scheduledTime?: string | null;
    subject?: string;
    body?: string;
  }): Promise<CampaignDTO> {
    const payload = {
      name: data.name,
      templateId: data.templateId || undefined,
      contactIds: data.contactIds || [],
      groupIds: data.groupIds || [],
      scheduledTime: data.scheduledTime || null,
      subject: data.subject,
      body: data.body,
    };
    return await this.request<CampaignDTO>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async updateCampaign(id: string, data: Partial<CampaignDTO>): Promise<CampaignDTO> {
    return await this.request<CampaignDTO>(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteCampaign(id: string): Promise<void> {
    await this.request(`/api/campaigns/${id}`, { method: 'DELETE' });
  }

  public static async sendCampaign(id: string): Promise<void> {
    await this.request(`/api/campaigns/${id}/send`, { method: 'POST' });
  }

  public static async scheduleCampaign(id: string, scheduledTime: string): Promise<void> {
    await this.request(`/api/campaigns/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledTime }),
    });
  }

  public static async cancelCampaign(id: string): Promise<void> {
    await this.request(`/api/campaigns/${id}/cancel`, { method: 'POST' });
  }

  public static async checkAndExecuteScheduledCampaigns(): Promise<string[]> {
    try {
      const campaigns = await this.getCampaigns();
      const now = Date.now();
      const due = campaigns.filter((c) => {
        if (c.status !== 'SCHEDULED' || !c.scheduledTime) return false;
        const t = new Date(c.scheduledTime).getTime();
        return !isNaN(t) && t <= now;
      });

      const dispatched: string[] = [];
      for (const campaign of due) {
        try {
          await this.sendCampaign(campaign.id);
          dispatched.push(campaign.id);
        } catch {
          // continue
        }
      }
      return dispatched;
    } catch {
      return [];
    }
  }

  public static async getCampaignStatus(id: string): Promise<CampaignDTO> {
    return await this.request<CampaignDTO>(`/api/campaigns/${id}/status`);
  }

  public static async getCampaignHistory(): Promise<CampaignDTO[]> {
    const res = await this.request<CampaignDTO[]>('/api/campaigns/history');
    return Array.isArray(res) ? res : [];
  }

  public static async getCampaignActivities(campaignId: string): Promise<CampaignActivity[]> {
    const res = await this.request<CampaignActivity[]>(`/api/campaigns/${campaignId}/activities`);
    return Array.isArray(res) ? res : [];
  }

  public static async getCampaignOpens(campaignId: string): Promise<CampaignActivity[]> {
    const res = await this.request<CampaignActivity[]>(`/api/campaigns/${campaignId}/activities/opens`);
    return Array.isArray(res) ? res : [];
  }

  public static async getCampaignClicks(campaignId: string): Promise<CampaignActivity[]> {
    const res = await this.request<CampaignActivity[]>(`/api/campaigns/${campaignId}/activities/clicks`);
    return Array.isArray(res) ? res : [];
  }

  public static async getEmailDeliveries(campaignId: string): Promise<EmailDelivery[]> {
    const res = await this.request<EmailDelivery[]>(`/api/emails/deliveries?campaignId=${encodeURIComponent(campaignId)}`);
    return Array.isArray(res) ? res : [];
  }

  public static async getDeliveryStatus(id: string): Promise<EmailDelivery> {
    return await this.request<EmailDelivery>(`/api/emails/deliveries/${id}`);
  }

  public static async retryFailedEmails(campaignId: string): Promise<void> {
    await this.request(`/api/emails/retry?campaignId=${encodeURIComponent(campaignId)}`, {
      method: 'POST',
    });
  }

  public static async getBouncedEmails(): Promise<EmailDelivery[]> {
    const res = await this.request<EmailDelivery[]>('/api/emails/bounces');
    return Array.isArray(res) ? res : [];
  }

  public static async getOverviewAnalytics(): Promise<AnalyticsDTO> {
    return await this.request<AnalyticsDTO>('/api/analytics/overview');
  }

  public static async getAllCampaignAnalytics(): Promise<AnalyticsDTO[]> {
    const res = await this.request<AnalyticsDTO[]>('/api/analytics/campaigns');
    return Array.isArray(res) ? res : [];
  }

  public static async getCampaignAnalytics(campaignId: string): Promise<AnalyticsDTO> {
    return await this.request<AnalyticsDTO>(`/api/analytics/${campaignId}`);
  }

  public static async getPerformanceTrends(): Promise<Record<string, any>> {
    return await this.request<Record<string, any>>('/api/analytics/trends');
  }

  public static async generateReports(): Promise<Record<string, any>> {
    return await this.request<Record<string, any>>('/api/analytics/reports');
  }

  public static async getAdminDashboard(): Promise<AdminDashboardData> {
    return await this.request<AdminDashboardData>('/api/admin/dashboard');
  }

  public static async getAdminUsers(): Promise<any[]> {
    const res = await this.request<any[]>('/api/admin/users');
    return Array.isArray(res) ? res : [];
  }

  public static async getAdminCampaigns(): Promise<any[]> {
    const res = await this.request<any[]>('/api/admin/campaigns');
    return Array.isArray(res) ? res : [];
  }

  public static async getAdminActivities(): Promise<any[]> {
    const res = await this.request<any[]>('/api/admin/activities');
    return Array.isArray(res) ? res : [];
  }

  public static async getAdminAnalytics(): Promise<AnalyticsDTO> {
    return await this.request<AnalyticsDTO>('/api/admin/analytics');
  }

  public static async getAdminLogs(): Promise<any[]> {
    const res = await this.request<any[]>('/api/admin/logs');
    return Array.isArray(res) ? res : [];
  }

  public static async getSystemLogs(): Promise<SystemLog[]> {
    const logs = await this.getAdminLogs();
    return logs.map((l: any, idx: number) => ({
      id: l.id || `log_${idx}`,
      level: l.level || 'INFO',
      message: l.message || JSON.stringify(l),
      timestamp: l.timestamp || new Date().toISOString(),
      action: l.action,
      details: l.details,
      service: l.service,
    }));
  }

  public static async trackActivity(campaignId: string, deliveryId: string, type: string, url?: string): Promise<void> {
    const params = new URLSearchParams({ campaignId, deliveryId, type });
    if (url) params.append('url', url);
    await this.request(`/api/activities/track?${params.toString()}`, { method: 'POST' });
  }
}
