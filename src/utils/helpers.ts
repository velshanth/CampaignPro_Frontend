import { CampaignDTO } from '../types';

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

export function formatTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export function formatRelativeTime(dateStr?: string | null): { text: string; isPast: boolean; isDueNow: boolean } {
  if (!dateStr) return { text: 'Not scheduled', isPast: false, isDueNow: false };
  try {
    const target = new Date(dateStr).getTime();
    if (isNaN(target)) return { text: 'Invalid date', isPast: false, isDueNow: false };

    const now = Date.now();
    const diffMs = target - now;

    if (diffMs <= 0 && diffMs > -60000) {
      return { text: 'Due now (dispatching)', isPast: true, isDueNow: true };
    }

    if (diffMs < 0) {
      const pastSeconds = Math.floor(Math.abs(diffMs) / 1000);
      if (pastSeconds < 60) return { text: `${pastSeconds}s ago`, isPast: true, isDueNow: false };
      const pastMinutes = Math.floor(pastSeconds / 60);
      if (pastMinutes < 60) return { text: `${pastMinutes}m ago`, isPast: true, isDueNow: false };
      const pastHours = Math.floor(pastMinutes / 60);
      if (pastHours < 24) return { text: `${pastHours}h ago`, isPast: true, isDueNow: false };
      const pastDays = Math.floor(pastHours / 24);
      return { text: `${pastDays}d ago`, isPast: true, isDueNow: false };
    }

    const futureSeconds = Math.floor(diffMs / 1000);
    if (futureSeconds < 60) return { text: `in ${futureSeconds}s`, isPast: false, isDueNow: false };
    const futureMinutes = Math.floor(futureSeconds / 60);
    if (futureMinutes < 60) return { text: `in ${futureMinutes}m`, isPast: false, isDueNow: false };
    const futureHours = Math.floor(futureMinutes / 60);
    if (futureHours < 24) {
      const remainingMins = futureMinutes % 60;
      return { text: `in ${futureHours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`.trim(), isPast: false, isDueNow: false };
    }
    const futureDays = Math.floor(futureHours / 24);
    return { text: `in ${futureDays}d`, isPast: false, isDueNow: false };
  } catch {
    return { text: '—', isPast: false, isDueNow: false };
  }
}

export function getCampaignScheduledTime(camp?: CampaignDTO | null): string | null {
  if (!camp) return null;
  return camp.scheduledTime || (camp as any).scheduledAt || (camp as any).scheduled_time || null;
}
