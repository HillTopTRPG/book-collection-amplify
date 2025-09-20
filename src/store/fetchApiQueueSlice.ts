import { createSelector, createSlice } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import type { Isbn13 } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

enableMapSet();

type BookImageQueue = Isbn13[];
type BookImageResults = Record<Isbn13, string | null>;

type FilterQueue = string[];
type FilterQueueResults = Record<string, BookData[]>;

type State = {
  // 書影URL取得処理 / キュー
  bookImageQueue: BookImageQueue;
  // 書影URL取得処理 / 処理結果
  bookImageQueueResults: BookImageResults;
  // NDL曖昧検索処理 / キュー
  filterQueue: FilterQueue;
  // NDL曖昧検索処理 / 処理結果
  filterQueueResults: FilterQueueResults;
};

const initialState: State = {
  bookImageQueue: [],
  bookImageQueueResults: {},
  filterQueue: [],
  filterQueueResults: {},
};

const checkBookImageExists = (key: Isbn13, state: State) => {
  const queue = state.bookImageQueue.includes(key);
  const result = state.bookImageQueueResults[key] !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

const checkFilterQueueExists = (key: string, state: State) => {
  const queueItem = state.filterQueue.includes(key);
  const resultItem = state.filterQueueResults[key];

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const fetchApiQueueSlice = createSlice({
  name: 'fetchApiQueue',
  initialState,
  reducers: {
    addGetImageQueue: (state, action: PayloadAction<{ isbnList: Isbn13[]; type: 'new' | 'retry' | 'priority' }>) => {
      const addList = action.payload.isbnList.filter(isbn => {
        if (action.payload.type === 'new') {
          return !checkBookImageExists(isbn, state);
        } else {
          return state.bookImageQueue.at(0) !== isbn;
        }
      });

      if (action.payload.type === 'new') {
        state.bookImageQueue.push(...addList);
      } else {
        state.bookImageQueue.splice(1, 0, ...addList);
      }
    },
    completeGetImageQueues: (state, action: PayloadAction<{ isbn: Isbn13; url: string | null }[]>) => {
      action.payload.forEach(({ isbn, url }) => {
        const existsCheck = checkBookImageExists(isbn, state);
        if (!existsCheck?.queue) return;

        // キューから一致するISBNを全て削除する
        state.bookImageQueue
          .flatMap((queuedIsbn, index) => (queuedIsbn === isbn ? [index] : []))
          .reverse()
          .forEach(deleteIndex => state.bookImageQueue.splice(deleteIndex, 1));
        state.bookImageQueueResults[isbn] = url;
      });
    },
    addFilterQueue: (state, action: PayloadAction<{ options: string[]; type: 'new' | 'priority' }>) => {
      const addList = action.payload.options.filter(option => {
        if (action.payload.type === 'new') {
          return !checkFilterQueueExists(option, state);
        } else {
          return state.filterQueue.at(0) !== option;
        }
      });

      if (action.payload.type === 'new') {
        state.filterQueue.push(...addList);
      } else {
        state.filterQueue.splice(1, 0, ...addList);
      }
    },
    completeFilterQueues: (state, action: PayloadAction<{ option: string; books: BookData[] }[]>) => {
      action.payload.forEach(({ option, books }) => {
        const existsCheck = checkFilterQueueExists(option, state);
        if (!existsCheck?.queue) return;

        // キューから一致するオプションを全て削除する
        state.filterQueue
          .flatMap((queuedOption, index) => (queuedOption === option ? [index] : []))
          .reverse()
          .forEach(deleteIndex => state.filterQueue.splice(deleteIndex, 1));
        state.filterQueueResults[option] = books;
      });
    },
  },
});

export const { addGetImageQueue, completeGetImageQueues, addFilterQueue, completeFilterQueues } =
  fetchApiQueueSlice.actions;

const selectBookImageQueueUnUnique = (state: RootState) =>
  state.fetchApiQueue.bookImageQueue.filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx);
export const selectBookImageQueue = createSelector([selectBookImageQueueUnUnique], bookImageQueueUnUnique =>
  bookImageQueueUnUnique.filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx)
);
/** 書影URL取得キューの中で処理対象のもの */
export const selectQueuedBookImageIsbn = createSelector([selectBookImageQueue], bookImageQueue =>
  bookImageQueue.slice(0, 1)
);
/** ISBNコード：書影URL のRecord */
export const selectBookImageQueueResults = (state: RootState) => state.fetchApiQueue.bookImageQueueResults;

const selectFilterQueue = (state: RootState) => state.fetchApiQueue.filterQueue;
/** NDL曖昧検索キューの中で処理対象のもの */
export const selectQueuedFilterOption = createSelector([selectFilterQueue], filterQueue => filterQueue.slice(0, 2));
/** NDL曖昧検索条件：書籍一覧 のRecord */
export const selectFilterQueueResults = (state: RootState) => state.fetchApiQueue.filterQueueResults;

export default fetchApiQueueSlice.reducer;
