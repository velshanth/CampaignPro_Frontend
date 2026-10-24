import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CampaignDTO, CampaignStatus, EmailDelivery, CampaignActivity, AnalyticsDTO } from '../../types';
import { ApiService } from '../../services/api';
import { fetchOverviewAnalytics } from './analyticsSlice';

interface CampaignsState {
  campaigns: CampaignDTO[];
  selectedCampaign: CampaignDTO | null;
  deliveries: EmailDelivery[];
  activities: CampaignActivity[];
  campaignAnalytics: AnalyticsDTO | null;
  filterStatus: 'ALL' | CampaignStatus;
  searchQuery: string;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

const initialState: CampaignsState = {
  campaigns: [],
  selectedCampaign: null,
  deliveries: [],
  activities: [],
  campaignAnalytics: null,
  filterStatus: 'ALL',
  searchQuery: '',
  isLoading: false,
  isSending: false,
  error: null,
};

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await ApiService.getCampaigns();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch campaigns');
    }
  }
);

export const fetchCampaignDetails = createAsyncThunk(
  'campaigns/fetchDetails',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const [campaign, deliveries, activities, analytics] = await Promise.all([
        ApiService.getCampaignById(campaignId),
        ApiService.getEmailDeliveries(campaignId),
        ApiService.getCampaignActivities(campaignId),
        ApiService.getCampaignAnalytics(campaignId),
      ]);
      return { campaign, deliveries, activities, analytics };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch campaign details');
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/create',
  async (
    data: {
      name: string;
      templateId?: string;
      contactIds?: string[];
      groupIds?: string[];
      scheduledTime?: string | null;
      subject?: string;
      body?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await ApiService.createCampaign(data);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create campaign');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/update',
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: Partial<CampaignDTO>;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const updated = await ApiService.updateCampaign(id, data);
      await dispatch(fetchCampaigns());
      await dispatch(fetchCampaignDetails(id));
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update campaign');
    }
  }
);

export const sendCampaign = createAsyncThunk(
  'campaigns/send',
  async (campaignId: string, { dispatch, rejectWithValue }) => {
    try {
      await ApiService.sendCampaign(campaignId);
      // Refresh campaign list & details
      await dispatch(fetchCampaigns());
      await dispatch(fetchCampaignDetails(campaignId));
      await dispatch(fetchOverviewAnalytics());
      return campaignId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to dispatch email campaign');
    }
  }
);

export const scheduleCampaign = createAsyncThunk(
  'campaigns/schedule',
  async (
    { id, scheduledTime }: { id: string; scheduledTime: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await ApiService.scheduleCampaign(id, scheduledTime);
      await dispatch(fetchCampaigns());
      await dispatch(fetchCampaignDetails(id));
      return { id, scheduledTime };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to schedule campaign');
    }
  }
);

export const cancelCampaign = createAsyncThunk(
  'campaigns/cancel',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await ApiService.cancelCampaign(id);
      await dispatch(fetchCampaigns());
      await dispatch(fetchCampaignDetails(id));
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel scheduled campaign');
    }
  }
);

export const checkDueScheduledCampaigns = createAsyncThunk(
  'campaigns/checkDue',
  async (_, { dispatch, getState }) => {
    const dispatchedIds = await ApiService.checkAndExecuteScheduledCampaigns();
    if (dispatchedIds.length > 0) {
      await dispatch(fetchCampaigns());
      const selected = (getState() as any).campaigns.selectedCampaign;
      if (selected && dispatchedIds.includes(selected.id)) {
        await dispatch(fetchCampaignDetails(selected.id));
      }
      return dispatchedIds;
    }
    return [];
  }
);

export const retryFailedDeliveries = createAsyncThunk(
  'campaigns/retryFailed',
  async (campaignId: string, { dispatch, rejectWithValue }) => {
    try {
      await ApiService.retryFailedEmails(campaignId);
      await dispatch(fetchCampaignDetails(campaignId));
      await dispatch(fetchCampaigns());
      return campaignId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to retry delivery');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ApiService.deleteCampaign(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete campaign');
    }
  }
);

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setFilterStatus: (state, action: PayloadAction<'ALL' | CampaignStatus>) => {
      state.filterStatus = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCampaign: (state, action: PayloadAction<CampaignDTO | null>) => {
      state.selectedCampaign = action.payload;
    },
    clearSelectedCampaign: (state) => {
      state.selectedCampaign = null;
      state.deliveries = [];
      state.activities = [];
      state.campaignAnalytics = null;
    },
    clearCampaignError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCampaignDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCampaignDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCampaign = action.payload.campaign;
        state.deliveries = Array.isArray(action.payload.deliveries) ? action.payload.deliveries : [];
        state.activities = Array.isArray(action.payload.activities) ? action.payload.activities : [];
        state.campaignAnalytics = action.payload.analytics;
      })
      .addCase(fetchCampaignDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaigns.unshift(action.payload);
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.selectedCampaign?.id === action.payload.id) {
          state.selectedCampaign = action.payload;
        }
      })
      .addCase(sendCampaign.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendCampaign.fulfilled, (state) => {
        state.isSending = false;
      })
      .addCase(sendCampaign.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(scheduleCampaign.fulfilled, (state, action) => {
        const camp = state.campaigns.find((c) => c.id === action.payload.id);
        if (camp) {
          camp.status = 'SCHEDULED';
          camp.scheduledTime = action.payload.scheduledTime;
        }
        if (state.selectedCampaign && state.selectedCampaign.id === action.payload.id) {
          state.selectedCampaign.status = 'SCHEDULED';
          state.selectedCampaign.scheduledTime = action.payload.scheduledTime;
        }
      })
      .addCase(cancelCampaign.fulfilled, (state, action) => {
        const camp = state.campaigns.find((c) => c.id === action.payload);
        if (camp) {
          camp.status = 'DRAFT';
          camp.scheduledTime = null;
        }
        if (state.selectedCampaign && state.selectedCampaign.id === action.payload) {
          state.selectedCampaign.status = 'DRAFT';
          state.selectedCampaign.scheduledTime = null;
        }
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
        if (state.selectedCampaign?.id === action.payload) {
          state.selectedCampaign = null;
        }
      })
      .addCase(checkDueScheduledCampaigns.fulfilled, (state, action) => {
        const dispatchedIds = action.payload as string[];
        if (dispatchedIds && dispatchedIds.length > 0) {
          dispatchedIds.forEach((id) => {
            const camp = state.campaigns.find((c) => c.id === id);
            if (camp) {
              camp.status = 'SENT';
              camp.sentTime = new Date().toISOString();
            }
          });
          if (state.selectedCampaign && dispatchedIds.includes(state.selectedCampaign.id)) {
            state.selectedCampaign.status = 'SENT';
            state.selectedCampaign.sentTime = new Date().toISOString();
          }
        }
      });
  },
});

export const {
  setFilterStatus,
  setSearchQuery,
  setSelectedCampaign,
  clearSelectedCampaign,
  clearCampaignError,
} = campaignsSlice.actions;
export default campaignsSlice.reducer;
