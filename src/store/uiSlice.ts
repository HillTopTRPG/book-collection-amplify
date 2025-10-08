import type { RootState } from './index.ts';
import type { CollectionBook } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type State = {
  bookDetailDialogValue: CollectionBook | null;
  swipeDialogValue: BookWithVolume[];
  isNavigating: boolean;
  resultDirection: 'left' | 'right' | null;
};

const initialState: State = {
  bookDetailDialogValue: null,
  swipeDialogValue: [],
  isNavigating: false,
  resultDirection: null,
} as const;

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBookDialogValue: (state, action: PayloadAction<CollectionBook | null>) => {
      state.bookDetailDialogValue = action.payload;
    },
    setSwipeDialogValue: (state, action: PayloadAction<BookWithVolume[]>) => {
      state.swipeDialogValue = action.payload;
    },
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    setResultDirection: (state, action: PayloadAction<'left' | 'right' | null>) => {
      state.resultDirection = action.payload;
    },
  },
});

export const { setBookDialogValue, setSwipeDialogValue, setNavigating, setResultDirection } = uiSlice.actions;

export const selectBookDialogValue = (state: RootState) => state.ui.bookDetailDialogValue;
export const selectSwipeDialogValue = (state: RootState) => state.ui.swipeDialogValue;
export const selectIsNavigating = (state: RootState) => state.ui.isNavigating;
export const selectResultDirection = (state: RootState) => state.ui.resultDirection;

export default uiSlice.reducer;
