import { createSelector, createSlice } from '@reduxjs/toolkit';

import { selectFetchedBookList } from '@/store/scannerSlice.ts';
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

export const bookDetailDrawerSlice = createSlice({
  name: 'scannerPageDrawer',
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

export const { openDrawer, closeDrawer } = bookDetailDrawerSlice.actions;

const selectSelectedBookIsbn = (state: RootState) => state.bookDetailDrawer.selectedBookIsbn;
export const selectSelectedBook = createSelector(
  [selectBooks, selectFetchedBookList, selectSelectedBookIsbn],
  (dbBooks, fetchedBooks, isbn) => {
    if (!isbn) return null;
    return dbBooks.find(filterMatch({ isbn })) ?? fetchedBooks.find(filterMatch({ isbn }))?.bookDetail?.book ?? null;
  }
);

export default bookDetailDrawerSlice.reducer;