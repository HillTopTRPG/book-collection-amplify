import type { RootState } from './index.ts';
import type { BookData } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type State = {
  bookDetailDialogValue: BookData | null;
};

const initialState: State = {
  bookDetailDialogValue: null,
} as const;

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBookDialogValue: (state, action: PayloadAction<BookData | null>) => {
      state.bookDetailDialogValue = action.payload;
    },
  },
});

export const { setBookDialogValue } = uiSlice.actions;

export const selectBookDialogValue = (state: RootState) => state.ui.bookDetailDialogValue;

export default uiSlice.reducer;
