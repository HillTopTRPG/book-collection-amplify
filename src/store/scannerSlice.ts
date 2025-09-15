import { createSelector, createSlice } from '@reduxjs/toolkit';
import { keys } from 'es-toolkit/compat';

import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';

import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ScannedItemMap = Record<string, { isbn: string; bookDetail: BookDetail | null, filterSets: FilterSet[] }>;

type State = {
  scannedItemMap: ScannedItemMap;
  isScanning: boolean;
  stream: MediaStream | null;
  error: string | null;
};

const initialState: State = {
  scannedItemMap: {},
  isScanning: false,
  stream: null,
  error: null,
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    addScannedIsbn: (state, action: PayloadAction<string>) => {
      const isbn = action.payload;
      state.scannedItemMap[isbn] = { isbn, bookDetail: null, filterSets: [] };
    },
    setFetchedBookData: (state, action: PayloadAction<ScannedItemMap>) => {
      for (const isbn of keys(action.payload)) {
        const item = state.scannedItemMap[isbn];
        if (!item) continue;
        item.bookDetail = action.payload[isbn].bookDetail;
        item.filterSets = action.payload[isbn].filterSets;
      }
    },
    rejectFetchBookData: (state, action: PayloadAction<string>) => {
      const isbn = action.payload;
      delete state.scannedItemMap[isbn];
    },
    clearScannedItems: (state) => {
      state.scannedItemMap = {};
    },
  },
});

export const {
  addScannedIsbn,
  setFetchedBookData,
  rejectFetchBookData,
  clearScannedItems,
} = scannerSlice.actions;

export const selectScannedItemMap = (state: RootState) => state.scanner.scannedItemMap;
export const selectFetchedBookList = createSelector(selectScannedItemMap, ((scannedItemMap) => keys(scannedItemMap).map(isbm => scannedItemMap[isbm]).flatMap((item) => item.bookDetail ? [item] : [])));

export default scannerSlice.reducer;