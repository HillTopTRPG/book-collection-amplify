import { configureStore } from '@reduxjs/toolkit';
// import bookDetailDrawerReducer from './bookDetailDrawerSlice.ts';
import editFilterReducer from './editFilterSlice.ts';
import fetchApiQueueReducer from './fetchApiQueueSlice';
import fetchResultReducer from './fetchResultSlice';
import filterDetailDrawerReducer from './filterDetailDrawerSlice.ts';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    editFilter: editFilterReducer,
    subscriptionData: subscriptionDataReducer,
    // bookDetailDrawer: bookDetailDrawerReducer,
    filterDetailDrawer: filterDetailDrawerReducer,
    fetchResult: fetchResultReducer,
    fetchApiQueue: fetchApiQueueReducer,
  },
  // 開発時のミドルウェア設定
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // MediaStreamは非シリアル化可能なので除外
        ignoredActions: [],
        ignoredActionsPaths: [],
        ignoredPaths: [
          'fetchApiQueue.bookImageQueue',
          'fetchApiQueue.bookImageResults',
          'fetchApiQueue.filterQueue',
          'fetchApiQueue.filterQueueResults',
          'scanner.scanningItemMap',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
