import { createSelector, createSlice } from '@reduxjs/toolkit';

import { filterMatch } from '@/utils/primitive.ts';

import { fetchBookDataThunk } from './scannerThunks';

import type { RootState } from './index.ts';
import type { BookData } from '../types/book';

export type ScannedItem = { isbn: string; data: BookData | null };

interface ScannerState {
  scannedItems: ScannedItem[];
  isScanning: boolean;
  stream: MediaStream | null;
  error: string | null;
}

const initialState: ScannerState = {
  scannedItems: [],
  isScanning: false,
  stream: null,
  error: null,
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    clearScannedItems: (state) => {
      state.scannedItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookDataThunk.pending, (state, action) => {
        const isbn = action.meta.arg;

        // 既に存在する場合はスキップ
        if (state.scannedItems.some(filterMatch({ isbn }))) return;

        state.scannedItems.unshift({ isbn, data: null });
      })
      .addCase(fetchBookDataThunk.fulfilled, (state, action) => {
        const { isbn, data } = action.payload;
        const item = state.scannedItems.find(item => item.isbn === isbn);
        if (item) {
          item.data = data;
        }
      })
      .addCase(fetchBookDataThunk.rejected, (state, action) => {
        const payload = action.payload;
        if (!payload) return;
        console.error('書籍データ取得エラー:', payload.errorMsg);
        const idx = state.scannedItems.findIndex(item => item.isbn === payload.isbn);
        state.scannedItems.splice(idx, 1);
        // エラーは個別のアイテムに関連付けることもできますが、
        // ここでは全体のエラー状態として管理
      });
  },
});

export const {
  clearScannedItems,
} = scannerSlice.actions;

export const selectScannedItems = (state: RootState) => state.scanner.scannedItems;
export const selectFetchedBookList = createSelector(selectScannedItems, ((scannedItems) => scannedItems.map(({ data }) => data).filter((book): book is BookData => Boolean(book))));

export default scannerSlice.reducer;