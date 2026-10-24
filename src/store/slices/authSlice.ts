import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserDTO, LoginRequest, RegisterRequest } from '../../types';
import { ApiService } from '../../services/api';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const sessionUserStr = sessionStorage.getItem('campaignpro_session_user');
const sessionToken = sessionStorage.getItem('campaignpro_session_token');
let sessionUser: UserDTO | null = null;
if (sessionUserStr) {
  try {
    sessionUser = JSON.parse(sessionUserStr);
  } catch {
    sessionUser = null;
  }
}

const initialState: AuthState = {
  user: sessionUser,
  token: sessionToken,
  isAuthenticated: !!(sessionUser && sessionToken),
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const res = await ApiService.login(credentials);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);
export const login = loginUser;

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const res = await ApiService.register(data);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);
export const register = registerUser;

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<UserDTO>, { rejectWithValue }) => {
    try {
      const res = await ApiService.updateProfile(data);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Profile update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      ApiService.clearToken();
      sessionStorage.removeItem('campaignpro_session_user');
      sessionStorage.removeItem('campaignpro_session_token');
      localStorage.removeItem('campaignpro_cached_user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        sessionStorage.setItem('campaignpro_session_user', JSON.stringify(action.payload.user));
        sessionStorage.setItem('campaignpro_session_token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Authentication failed';
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        sessionStorage.setItem('campaignpro_session_user', JSON.stringify(action.payload.user));
        sessionStorage.setItem('campaignpro_session_token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Registration failed';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        sessionStorage.setItem('campaignpro_session_user', JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
