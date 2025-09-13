import { createSelector, createSlice } from '@reduxjs/toolkit';

import { filterMatch } from '@/utils/primitive.ts';

import { selectBooks } from './subscriptionDataSlice';

import type { RootState } from './index';
import type { PayloadAction } from '@reduxjs/toolkit';

type State = {
  selectedBookIsbn: string | null;
};

const initialState: State = {
  selectedBookIsbn: null,
};

export const bookDetailSlice = createSlice({
  name: 'bookDetail',
  initialState,
  reducers: {
    openDrawer: (state, action: PayloadAction<string>) => {
      state.selectedBookIsbn = action.payload;
    },
    closeDrawer: (state) => {
      state.selectedBookIsbn = null;
    },
  },
});

export const { openDrawer, closeDrawer } = bookDetailSlice.actions;

export const selectSelectedBookIsbn = (state: RootState) => state.bookDetail.selectedBookIsbn;
export const selectSelectedBook = createSelector(
  [selectBooks, selectSelectedBookIsbn],
  (books, isbn) => {
    if (!isbn) return null;
    return books.find(filterMatch({ isbn })) ?? null;
  }
);

export default bookDetailSlice.reducer;