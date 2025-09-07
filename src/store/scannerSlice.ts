import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BookData } from '../types/book';
import { fetchBookDataThunk } from './scannerThunks';
import {RootState} from './index.ts'

export interface ScannedItem { isbn: string; data: BookData | null }

interface ScannerState {
  scannedItems: ScannedItem[];
}

const initialState: ScannerState = {
  scannedItems: [],
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    // バーコードスキャン関連
    addScannedItem: (state, action: PayloadAction<{ isbn: string }>) => {
      // 既に存在する場合はスキップ
      if (state.scannedItems.some(({isbn}) => isbn === action.payload.isbn)) {
        return;
      }
      const { isbn } = action.payload;

      const newItem: ScannedItem = {
        isbn,
        data: null,
      };

      state.scannedItems.unshift(newItem);
    },

    updateScannedItemData: (state, action: PayloadAction<{ isbn: string; data: BookData }>) => {
      const { isbn, data } = action.payload;
      const item = state.scannedItems.find(item => item.isbn === isbn);
      if (item) {
        item.data = data;
      }
    },

    clearScannedItems: (state) => {
      state.scannedItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookDataThunk.pending, (_, action) => {
        const isbn = action.meta.arg
        console.log(isbn);
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
  addScannedItem,
  updateScannedItemData,
  clearScannedItems,
} = scannerSlice.actions;

export const selectScannedItems = (state: RootState) => state.scanner.scannedItems;

export default scannerSlice.reducer;