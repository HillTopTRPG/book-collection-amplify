import { createSelector, createSlice } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';

import type { BookData } from '@/types/book.ts';

import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

enableMapSet();

type BookImageQueueValue = { defaultUrl: string; isbn: string };
type BookImageQueue = Map<string, BookImageQueueValue>;
type BookImageResults = Map<string, string | null>;

type FilterQueue = Map<string, string>;
type FilterQueueResults = Map<string, BookData[]>;

type State = {
  bookImageQueue: BookImageQueue;
  bookImageResults: BookImageResults;
  filterQueue: FilterQueue;
  filterQueueResults: FilterQueueResults;
};

const initialState: State = {
  bookImageQueue: new Map<string, BookImageQueueValue>,
  bookImageResults: new Map<string, string | null>,
  filterQueue: new Map<string, string>,
  filterQueueResults: new Map<string, BookData[]>,
};

const checkQueueExistsBase = (queueMap: 'bookImageQueue' | 'filterQueue', resultMap: 'bookImageResults' | 'filterQueueResults') => (key: string, state: State) => {
  const queueItem = state[queueMap].get(key);
  const resultItem = state[resultMap].get(key);

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return (queue || result) ? { queue, result, both: queue && result } : null;
};

const checkBookImageExists = checkQueueExistsBase('bookImageQueue', 'bookImageResults');

const checkFilterQueueExists = checkQueueExistsBase('filterQueue', 'filterQueueResults');

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
    addFilterQueue: (state, action: PayloadAction<string>) => {
      const option = action.payload;

      const checkResult = checkFilterQueueExists(option, state);
      console.log('addFilterQueue1', JSON.stringify(checkResult, null, 2));
      if (checkResult) return;
      console.log('addFilterQueue', option);

      state.filterQueue.set(option, option);
    },
    completeFilterQueues: (state, action: PayloadAction<{ option: string; books: BookData[] }[]>) => {
      action.payload.forEach(({ option, books }) => {
        const existsCheck = checkFilterQueueExists(option, state);
        console.log('completeFilterQueue1', option, JSON.stringify(existsCheck, null, 2));
        if (!existsCheck?.queue || existsCheck?.result) return;

        console.log('completeFilterQueue', option, JSON.stringify(books, null, 2));

        state.filterQueue.delete(option);
        state.filterQueueResults.set(option, books);
      });
    },
  },
});

export const {
  addGetImageQueue,
  completeGetImageQueues,
  addFilterQueue,
  completeFilterQueues,
} = fetchApiQueueSlice.actions;

const selectBookImageQueue = (state: RootState) => state.fetchApiQueue.bookImageQueue;
export const selectQueuedBookImageIsbn = createSelector([selectBookImageQueue], (bookImageQueue) => {
  const entries = bookImageQueue.entries();

  return Array.from(entries).slice(0, 1).map(item => item[1]);
});
export const selectBookImageResults = (state: RootState) => state.fetchApiQueue.bookImageResults;

const selectFilterQueue = (state: RootState) => state.fetchApiQueue.filterQueue;
export const selectQueuedFilterOption = createSelector([selectFilterQueue], (filterQueue) => {
  const entries = filterQueue.entries();

  return Array.from(entries).slice(0, 2).map(item => item[1]);
});
/** フィルター内容 : 書籍一覧 */
export const selectFilterQueueResults = (state: RootState) => state.fetchApiQueue.filterQueueResults;

export default fetchApiQueueSlice.reducer;
