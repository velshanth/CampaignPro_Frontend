import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContactDTO, ContactGroupDTO } from '../../types';
import { ApiService } from '../../services/api';

interface ContactsState {
  contacts: ContactDTO[];
  groups: ContactGroupDTO[];
  selectedGroup: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  groups: [],
  selectedGroup: null,
  searchQuery: '',
  isLoading: false,
  error: null,
};

export const fetchContactsAndGroups = createAsyncThunk(
  'contacts/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [contacts, groups] = await Promise.all([
        ApiService.getContacts(),
        ApiService.getGroups(),
      ]);
      return { contacts, groups };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch contacts');
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/create',
  async (contact: Omit<ContactDTO, 'id' | 'userId'>, { rejectWithValue }) => {
    try {
      return await ApiService.createContact(contact);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/update',
  async ({ id, data }: { id: string; data: Partial<ContactDTO> }, { rejectWithValue }) => {
    try {
      return await ApiService.updateContact(id, data);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ApiService.deleteContact(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete contact');
    }
  }
);

export const createGroup = createAsyncThunk(
  'contacts/createGroup',
  async (group: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      return await ApiService.createGroup(group);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create group');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'contacts/deleteGroup',
  async (id: string, { rejectWithValue }) => {
    try {
      await ApiService.deleteGroup(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete group');
    }
  }
);

export const batchImportContacts = createAsyncThunk(
  'contacts/batchImport',
  async (contacts: Array<Omit<ContactDTO, 'id' | 'userId'>>, { dispatch }) => {
    for (const c of contacts) {
      await ApiService.createContact(c);
    }
    await dispatch(fetchContactsAndGroups());
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSelectedGroup: (state, action: PayloadAction<string | null>) => {
      state.selectedGroup = action.payload;
    },
    setContactSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearContactError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactsAndGroups.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchContactsAndGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = Array.isArray(action.payload?.contacts) ? action.payload.contacts : [];
        state.groups = Array.isArray(action.payload?.groups) ? action.payload.groups : [];
      })
      .addCase(fetchContactsAndGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.contacts.unshift(action.payload);
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const idx = state.contacts.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) {
          state.contacts[idx] = action.payload;
        }
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.id !== action.payload);
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g.id !== action.payload);
        if (state.selectedGroup === action.payload) {
          state.selectedGroup = null;
        }
      });
  },
});

export const { setSelectedGroup, setContactSearchQuery, clearContactError } = contactsSlice.actions;
export default contactsSlice.reducer;
