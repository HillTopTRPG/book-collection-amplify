import { configureStore } from '@reduxjs/toolkit';

import bookDetailReducer from './bookDetailSlice';
import filterReducer from './filterSlice';
import scannerReducer from './scannerSlice';
import subscriptionDataReducer from './subscriptionDataSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
    filter: filterReducer,
    subscriptionData: subscriptionDataReducer,
    bookDetail: bookDetailReducer,
  },
  // 開発時のミドルウェア設定
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // MediaStreamは非シリアル化可能なので除外
        ignoredActions: [],
        ignoredActionsPaths: ['payload.stream'],
        ignoredPaths: ['scanner.stream'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;