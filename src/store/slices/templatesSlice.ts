import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TemplateDTO } from '../../types';
import { ApiService } from '../../services/api';

interface TemplatesState {
  templates: TemplateDTO[];
  defaultTemplates: TemplateDTO[];
  selectedTemplate: TemplateDTO | null;
  previewHtml: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TemplatesState = {
  templates: [],
  defaultTemplates: [],
  selectedTemplate: null,
  previewHtml: null,
  isLoading: false,
  error: null,
};

export const fetchTemplates = createAsyncThunk(
  'templates/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [userTemplates, defaultTemplates] = await Promise.all([
        ApiService.getTemplates(),
        ApiService.getDefaultTemplates(),
      ]);
      return { userTemplates, defaultTemplates };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch templates');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'templates/create',
  async (data: { name: string; subject: string; body: string }, { rejectWithValue }) => {
    try {
      return await ApiService.createTemplate(data);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/update',
  async ({ id, data }: { id: string; data: Partial<TemplateDTO> }, { rejectWithValue }) => {
    try {
      return await ApiService.updateTemplate(id, data);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ApiService.deleteTemplate(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete template');
    }
  }
);

export const previewTemplate = createAsyncThunk(
  'templates/preview',
  async (id: string, { rejectWithValue }) => {
    try {
      return await ApiService.previewTemplate(id);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to generate preview');
    }
  }
);

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSelectedTemplate: (state, action: PayloadAction<TemplateDTO | null>) => {
      state.selectedTemplate = action.payload;
    },
    clearPreview: (state) => {
      state.previewHtml = null;
    },
    clearTemplateError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        const defaultTemplates = Array.isArray(action.payload?.defaultTemplates)
          ? action.payload.defaultTemplates
          : [];
        const userTemplatesRaw = Array.isArray(action.payload?.userTemplates)
          ? action.payload.userTemplates
          : [];
        const defaultIds = new Set(defaultTemplates.map((t) => t.id));
        const userTemplates = userTemplatesRaw.filter((t) => !defaultIds.has(t.id));
        state.templates = userTemplates;
        state.defaultTemplates = defaultTemplates;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const idx = state.templates.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.templates[idx] = action.payload;
        }
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
        if (state.selectedTemplate?.id === action.payload) {
          state.selectedTemplate = null;
        }
      })
      .addCase(previewTemplate.fulfilled, (state, action) => {
        state.previewHtml = action.payload;
      });
  },
});

export const { setSelectedTemplate, clearPreview, clearTemplateError } = templatesSlice.actions;
export default templatesSlice.reducer;
