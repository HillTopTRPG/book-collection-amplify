import { configureStore } from '@reduxjs/toolkit';
// import bookDetailDrawerReducer from './bookDetailDrawerSlice.ts';
import fetchBookImageReducer from './fetchBookImageSlice';
import fetchNdlSearchReducer from './fetchNdlSearchSlice';
import fetchResultReducer from './fetchResultSlice';
import filterDetailDrawerReducer from './filterDetailDrawerSlice.ts';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    subscriptionData: subscriptionDataReducer,
    filterDetailDrawer: filterDetailDrawerReducer,
    fetchResult: fetchResultReducer,
    fetchBookImage: fetchBookImageReducer,
    fetchNdlSearch: fetchNdlSearchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
