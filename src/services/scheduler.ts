import { ApiService } from './api';
import { fetchCampaigns, fetchCampaignDetails } from '../store/slices/campaignsSlice';
import { getCampaignScheduledTime } from '../utils/helpers';
import type { AppDispatch } from '../store';

/**
 * Service to periodically evaluate and dispatch scheduled campaigns
 * once their scheduled time has arrived.
 */
class CampaignScheduler {
  private intervalId: any = null;
  private isProcessing = false;
  private dispatchedCampaignIds = new Set<string>();

  /**
   * Start periodic check for scheduled campaigns
   */
  public start(dispatch: AppDispatch, intervalMs = 4000) {
    if (this.intervalId) return;

    // Run immediate check
    this.checkDueCampaigns(dispatch);

    this.intervalId = setInterval(() => {
      this.checkDueCampaigns(dispatch);
    }, intervalMs);
  }

  /**
   * Stop the scheduler
   */
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Manually trigger check for due campaigns
   */
  public async checkDueCampaigns(dispatch: AppDispatch): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let dispatchedCount = 0;
    try {
      const campaigns = await ApiService.getCampaigns();
      const now = Date.now();

      const scheduledCampaigns = campaigns.filter(
        (c) => c.status === 'SCHEDULED' && !this.dispatchedCampaignIds.has(c.id)
      );

      for (const camp of scheduledCampaigns) {
        const schedTimeStr = getCampaignScheduledTime(camp);
        if (!schedTimeStr) continue;

        const schedTime = new Date(schedTimeStr).getTime();
        if (isNaN(schedTime)) continue;

        // If scheduled time has arrived or passed
        if (schedTime <= now) {
          this.dispatchedCampaignIds.add(camp.id);
          try {
            await ApiService.sendCampaign(camp.id);
            dispatchedCount++;
            // Refresh list and details in Redux
            await dispatch(fetchCampaigns());
            await dispatch(fetchCampaignDetails(camp.id));
          } catch (sendErr) {
            console.error(`[Scheduler] Failed to dispatch scheduled campaign ${camp.id}:`, sendErr);
            this.dispatchedCampaignIds.delete(camp.id);
          }
        }
      }
    } catch (err) {
      console.warn('[Scheduler] Error checking scheduled campaigns:', err);
    } finally {
      this.isProcessing = false;
    }

    return dispatchedCount;
  }
}

export const campaignScheduler = new CampaignScheduler();
