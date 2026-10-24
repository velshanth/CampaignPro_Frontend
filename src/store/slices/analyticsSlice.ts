import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AnalyticsDTO } from '../../types';
import { ApiService } from '../../services/api';

interface AnalyticsState {
  overview: AnalyticsDTO | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  overview: null,
  isLoading: false,
  error: null,
};

export const fetchOverviewAnalytics = createAsyncThunk(
  'analytics/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await ApiService.getOverviewAnalytics();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverviewAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOverviewAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchOverviewAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default analyticsSlice.reducer;
