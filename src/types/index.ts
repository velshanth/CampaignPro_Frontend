export interface UserDTO {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | string;
  active: boolean;
  customFields?: Record<string, string>;
  campaignCount?: number;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: UserDTO;
}

export interface ContactDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  groups?: string[];
  customFields?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactGroupDTO {
  id: string;
  userId: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateDTO {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  placeholders?: string[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';

export interface CampaignDTO {
  id: string;
  userId: string;
  name: string;
  templateId?: string;
  contactIds?: string[];
  groupIds?: string[];
  status: CampaignStatus;
  scheduledTime?: string | null;
  sentTime?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  subject?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DeliveryStatus = 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';

export interface EmailDelivery {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: DeliveryStatus;
  errorMessage?: string;
  retryCount: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  contactName?: string;
}

export type ActivityType = 'OPEN' | 'CLICK' | 'BOUNCE';

export interface CampaignActivity {
  id: string;
  campaignId: string;
  deliveryId: string;
  contactId: string;
  type: ActivityType;
  linkClicked?: string;
  timestamp: string;
  contactEmail?: string;
  contactName?: string;
}

export interface AnalyticsDTO {
  id?: string;
  campaignId?: string;
  userId?: string;
  campaignName?: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  calculatedAt?: string;
}
