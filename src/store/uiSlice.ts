import type { RootState } from './index.ts';
import type { BookDetail } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type State = {
  bookDetailDialogValue: BookDetail | null;
};

const initialState: State = {
  bookDetailDialogValue: null,
} as const;

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBookDetailDialogValue: (state, action: PayloadAction<BookDetail | null>) => {
      state.bookDetailDialogValue = action.payload;
    },
  },
});

export const { setBookDetailDialogValue } = uiSlice.actions;

export const selectBookDetailDialogValue = (state: RootState) => state.ui.bookDetailDialogValue;

export default uiSlice.reducer;
