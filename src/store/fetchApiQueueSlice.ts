import { createSelector, createSlice } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import type { Isbn13 } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

enableMapSet();

type BookImageQueue = Map<Isbn13, Isbn13>;
type BookImageResults = Map<Isbn13, string | null>;

type FilterQueue = Map<string, string>;
type FilterQueueResults = Map<string, BookData[]>;

type State = {
  bookImageQueue: BookImageQueue;
  bookImageResults: BookImageResults;
  filterQueue: FilterQueue;
  filterQueueResults: FilterQueueResults;
};

const initialState: State = {
  bookImageQueue: new Map<Isbn13, Isbn13>(),
  bookImageResults: new Map<Isbn13, string | null>(),
  filterQueue: new Map<string, string>(),
  filterQueueResults: new Map<string, BookData[]>(),
};

const checkBookImageExists = (key: Isbn13, state: State) => {
  const queueItem = state.bookImageQueue.get(key);
  const resultItem = state.bookImageResults.get(key);

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

const checkFilterQueueExists = (key: string, state: State) => {
  const queueItem = state.filterQueue.get(key);
  const resultItem = state.filterQueueResults.get(key);

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const fetchApiQueueSlice = createSlice({
  name: 'fetchApiQueue',
  initialState,
  reducers: {
    addGetImageQueue: (state, action: PayloadAction<Isbn13>) => {
      const isbn = action.payload;

      if (checkBookImageExists(isbn, state)) return;

      state.bookImageQueue.set(isbn, isbn);
    },
    retryGetImageQueue: (state, action: PayloadAction<Isbn13[]>) => {
      const retryList = action.payload;
      retryList.forEach(isbn => {
        const existsCheck = checkBookImageExists(isbn, state);
        if (existsCheck?.queue) return;

        state.bookImageQueue.set(isbn, isbn);
      });
    },
    completeGetImageQueues: (state, action: PayloadAction<{ isbn: Isbn13; url: string | null }[]>) => {
      action.payload.forEach(({ isbn, url }) => {
        const existsCheck = checkBookImageExists(isbn, state);
        if (!existsCheck?.queue) return;

        state.bookImageQueue.delete(isbn);
        state.bookImageResults.set(isbn, url);
      });
    },
    addFilterQueue: (state, action: PayloadAction<string>) => {
      const option = action.payload;

      const checkResult = checkFilterQueueExists(option, state);
      if (checkResult) return;

      state.filterQueue.set(option, option);
    },
    completeFilterQueues: (state, action: PayloadAction<{ option: string; books: BookData[] }[]>) => {
      action.payload.forEach(({ option, books }) => {
        const existsCheck = checkFilterQueueExists(option, state);
        if (!existsCheck?.queue) return;

        console.log('completeFilterQueue', option, books);

        state.filterQueue.delete(option);
        state.filterQueueResults.set(option, books);
      });
    },
  },
});

export const { addGetImageQueue, retryGetImageQueue, completeGetImageQueues, addFilterQueue, completeFilterQueues } =
  fetchApiQueueSlice.actions;

const selectBookImageQueue = (state: RootState) => state.fetchApiQueue.bookImageQueue;
export const selectQueuedBookImageIsbn = createSelector([selectBookImageQueue], bookImageQueue => {
  const entries = bookImageQueue.entries();

  return Array.from(entries)
    .slice(0, 1)
    .map(item => item[1]);
});
export const selectBookImageResults = (state: RootState) => state.fetchApiQueue.bookImageResults;

const selectFilterQueue = (state: RootState) => state.fetchApiQueue.filterQueue;
export const selectQueuedFilterOption = createSelector([selectFilterQueue], filterQueue => {
  const entries = filterQueue.entries();

  return Array.from(entries)
    .slice(0, 2)
    .map(item => item[1]);
});
/** フィルター内容 : 書籍一覧 */
export const selectFilterQueueResults = (state: RootState) => state.fetchApiQueue.filterQueueResults;

export default fetchApiQueueSlice.reducer;
