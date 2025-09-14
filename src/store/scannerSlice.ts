import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { filterMatch } from '@/utils/primitive.ts';

import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ScannedItem = { isbn: string; bookDetail: BookDetail | null, filterSets: FilterSet[] };

type State = {
  scannedItems: ScannedItem[];
  isScanning: boolean;
  stream: MediaStream | null;
  error: string | null;
};

const initialState: State = {
  scannedItems: [],
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
      state.scannedItems.unshift({ isbn, bookDetail: null, filterSets: [] });
    },
    setFetchedBookData: (state, action: PayloadAction<ScannedItem>) => {
      const isbn = action.payload.isbn;
      const item = state.scannedItems.find(filterMatch({ isbn }));
      if (!item) return;
      item.bookDetail = action.payload.bookDetail;
      item.filterSets = action.payload.filterSets;
    },
    rejectFetchBookData: (state, action: PayloadAction<string>) => {
      const isbn = action.payload;
      const idx = state.scannedItems.findIndex(filterMatch({ isbn }));
      state.scannedItems.splice(idx, 1);
    },
    clearScannedItems: (state) => {
      state.scannedItems = [];
    },
  },
});

export const {
  addScannedIsbn,
  setFetchedBookData,
  rejectFetchBookData,
  clearScannedItems,
} = scannerSlice.actions;

export const selectScannedItems = (state: RootState) => state.scanner.scannedItems;
export const selectFetchedBookList = createSelector(selectScannedItems, ((scannedItems) => scannedItems.flatMap((item) => item.bookDetail ? [item] : [])));

export default scannerSlice.reducer;