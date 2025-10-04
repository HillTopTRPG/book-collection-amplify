import { configureStore } from '@reduxjs/toolkit';
import fetchBookImageReducer from './fetchBookImageSlice';
import fetchGoogleSearchReducer from './fetchGoogleSearchSlice';
import fetchNdlSearchReducer from './fetchNdlSearchSlice';
import fetchRakutenSearchReducer from './fetchRakutenSearchSlice';
import filterDetailDrawerReducer from './filterDetailDrawerSlice.ts';
import ndlSearchReducer from './ndlSearchSlice';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';
import uiReducer from './uiSlice.ts';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    subscriptionData: subscriptionDataReducer,
    filterDetailDrawer: filterDetailDrawerReducer,
    fetchBookImage: fetchBookImageReducer,
    ndlSearch: ndlSearchReducer,
    fetchNdlSearch: fetchNdlSearchReducer,
    fetchGoogleSearch: fetchGoogleSearchReducer,
    fetchRakutenSearch: fetchRakutenSearchReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
