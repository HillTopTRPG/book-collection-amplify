import { configureStore } from '@reduxjs/toolkit';
// import bookDetailDrawerReducer from './bookDetailDrawerSlice.ts';
import editFilterReducer from './editFilterSlice.ts';
import fetchBookImageReducer from './fetchBookImageSlice';
import fetchNdlFuzzySearchReducer from './fetchNdlFuzzySearchSlice';
import fetchResultReducer from './fetchResultSlice';
import filterDetailDrawerReducer from './filterDetailDrawerSlice.ts';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    editFilter: editFilterReducer,
    subscriptionData: subscriptionDataReducer,
    filterDetailDrawer: filterDetailDrawerReducer,
    fetchResult: fetchResultReducer,
    fetchBookImage: fetchBookImageReducer,
    fetchNdlFuzzySearch: fetchNdlFuzzySearchReducer,
  },
  // 開発時のミドルウェア設定
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // MediaStreamは非シリアル化可能なので除外
        ignoredActions: [],
        ignoredActionsPaths: [],
        ignoredPaths: ['scanner.scanningItemMap'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
