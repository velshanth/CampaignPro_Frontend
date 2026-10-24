import { combineReducers, configureStore, UnknownAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import campaignsReducer from './slices/campaignsSlice';
import contactsReducer from './slices/contactsSlice';
import templatesReducer from './slices/templatesSlice';
import analyticsReducer from './slices/analyticsSlice';
import configReducer from './slices/configSlice';

const appReducer = combineReducers({
  auth: authReducer,
  campaigns: campaignsReducer,
  contacts: contactsReducer,
  templates: templatesReducer,
  analytics: analyticsReducer,
  config: configReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) => {
  if (action.type === 'auth/logout') {
    const preservedConfig = state?.config;
    state = undefined;
    const nextState = appReducer(state, action);
    if (preservedConfig) {
      nextState.config = preservedConfig;
    }
    return nextState;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

