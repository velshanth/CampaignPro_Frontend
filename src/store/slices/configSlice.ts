import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiService } from '../../services/api';

interface ConfigState {
  backendUrl: string;
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: string | null;
  latency: number | null;
  statusMessage: string;
}

const initialState: ConfigState = {
  backendUrl: ApiService.getBaseUrl(),
  isConnected: false,
  isChecking: false,
  lastChecked: null,
  latency: null,
  statusMessage: 'Ready to connect',
};

export const checkBackendHealth = createAsyncThunk(
  'config/checkHealth',
  async (customUrl: string | undefined, { getState }) => {
    const url = customUrl || (getState() as any).config.backendUrl;
    const res = await ApiService.testBackendConnection(url);
    return res;
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setBackendUrl: (state, action: PayloadAction<string>) => {
      state.backendUrl = action.payload;
      ApiService.setBaseUrl(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkBackendHealth.pending, (state) => {
        state.isChecking = true;
      })
      .addCase(checkBackendHealth.fulfilled, (state, action) => {
        state.isChecking = false;
        state.isConnected = action.payload.ok;
        state.statusMessage = action.payload.message;
        state.latency = action.payload.latency || null;
        state.lastChecked = new Date().toLocaleTimeString();
      })
      .addCase(checkBackendHealth.rejected, (state) => {
        state.isChecking = false;
        state.isConnected = false;
        state.statusMessage = 'Connection check failed';
        state.lastChecked = new Date().toLocaleTimeString();
      });
  },
});

export const { setBackendUrl } = configSlice.actions;
export default configSlice.reducer;
