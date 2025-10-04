import type { RootState } from './index.ts';
import type { BookData } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type State = {
  bookDetailDialogValue: BookData | null;
  isNavigating: boolean;
};

const initialState: State = {
  bookDetailDialogValue: null,
  isNavigating: false,
} as const;

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBookDialogValue: (state, action: PayloadAction<BookData | null>) => {
      state.bookDetailDialogValue = action.payload;
    },
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
  },
});

export const { setBookDialogValue, setNavigating } = uiSlice.actions;

export const selectBookDialogValue = (state: RootState) => state.ui.bookDetailDialogValue;
export const selectIsNavigating = (state: RootState) => state.ui.isNavigating;

export default uiSlice.reducer;
