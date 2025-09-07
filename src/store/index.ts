import { configureStore } from '@reduxjs/toolkit';
import scannerReducer from './scannerSlice';

export const store = configureStore({
  reducer: {
    scanner: scannerReducer,
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