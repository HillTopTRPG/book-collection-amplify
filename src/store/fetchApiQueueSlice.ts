import { createSelector, createSlice } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';

import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

enableMapSet();

type BookImageQueueValue = { defaultUrl: string; isbn: string };
type BookImageQueue = Map<string, BookImageQueueValue>;
type BookImageResults = Map<string, string | null>;

type State = {
  bookImageQueue: BookImageQueue;
  bookImageResults: BookImageResults;
};

const initialState: State = {
  bookImageQueue: new Map<string, BookImageQueueValue>,
  bookImageResults: new Map<string, string | null>,
};

const checkBookImageExists = (isbn: string, state: State) => {
  const queueItem = state.bookImageQueue.get(isbn);
  const resultItem = state.bookImageResults.get(isbn);

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return (queue || result) ? { queue, result, both: queue && result } : null;
};

export const fetchApiQueueSlice = createSlice({
  name: 'fetchApiQueue',
  initialState,
  reducers: {
    addGetImageQueue: (state, action: PayloadAction<BookImageQueueValue>) => {
      const isbn = action.payload.isbn;

      if (checkBookImageExists(isbn, state)) return;

      state.bookImageQueue.set(isbn, action.payload);
    },
    completeGetImageQueues: (state, action: PayloadAction<{ isbn: string; url: string | null }[]>) => {
      action.payload.forEach(({ isbn, url }) => {
        const existsCheck = checkBookImageExists(isbn, state);
        if (!existsCheck?.queue || existsCheck?.result) return;

        state.bookImageQueue.delete(isbn);
        state.bookImageResults.set(isbn, url);
      });
    },
  },
});

export const {
  addGetImageQueue,
  completeGetImageQueues,
} = fetchApiQueueSlice.actions;

export const selectBookImageQueue = (state: RootState) => state.fetchApiQueue.bookImageQueue;
export const selectQueuedBookImageIsbn = createSelector([selectBookImageQueue], (bookImageQueue) => {
  const entries = bookImageQueue.entries();

  return Array.from(entries).slice(0, 1).map(item => item[1]);
});
export const selectBookImageResults = (state: RootState) => state.fetchApiQueue.bookImageResults;

export default fetchApiQueueSlice.reducer;
