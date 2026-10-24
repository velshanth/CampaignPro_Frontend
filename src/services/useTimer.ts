import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { checkDueScheduledCampaigns, fetchCampaignDetails, fetchCampaigns } from '../store/slices/campaignsSlice';
import { fetchOverviewAnalytics } from '../store/slices/analyticsSlice';

export function useTimer() {
  const dispatch = useAppDispatch();
  const { selectedCampaign } = useAppSelector((state) => state.campaigns);
  const selectedCampaignIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedCampaignIdRef.current = selectedCampaign ? selectedCampaign.id : null;
  }, [selectedCampaign]);

  useEffect(() => {
    const checkSchedule = async () => {
      try {
        const resultAction = await dispatch(checkDueScheduledCampaigns());
        if (checkDueScheduledCampaigns.fulfilled.match(resultAction)) {
          const dispatchedIds = resultAction.payload as string[];
          if (dispatchedIds && dispatchedIds.length > 0) {
            dispatch(fetchCampaigns());
            dispatch(fetchOverviewAnalytics());
            if (selectedCampaignIdRef.current && dispatchedIds.includes(selectedCampaignIdRef.current)) {
              dispatch(fetchCampaignDetails(selectedCampaignIdRef.current));
            }
          }
        }
      } catch (err) {
        console.error('[Scheduler Hook] Error during schedule check:', err);
      }
    };

    checkSchedule();

    const interval = setInterval(checkSchedule, 4000);

    return () => clearInterval(interval);
  }, [dispatch]);
}

export const useCampaignScheduler = useTimer;

