import { configureStore } from '@reduxjs/toolkit';
// import bookDetailDrawerReducer from './bookDetailDrawerSlice.ts';
import fetchBookImageReducer from './fetchBookImageSlice';
import fetchGoogleSearchReducer from './fetchGoogleSearchSlice';
import fetchNdlSearchReducer from './fetchNdlSearchSlice';
import fetchRakutenSearchReducer from './fetchRakutenSearchSlice';
import fetchResultReducer from './fetchResultSlice';
import filterDetailDrawerReducer from './filterDetailDrawerSlice.ts';
import ndlSearchReducer from './ndlSearchSlice';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    subscriptionData: subscriptionDataReducer,
    filterDetailDrawer: filterDetailDrawerReducer,
    fetchResult: fetchResultReducer,
    fetchBookImage: fetchBookImageReducer,
    ndlSearch: ndlSearchReducer,
    fetchNdlSearch: fetchNdlSearchReducer,
    fetchGoogleSearch: fetchGoogleSearchReducer,
    fetchRakutenSearch: fetchRakutenSearchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
