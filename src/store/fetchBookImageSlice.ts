import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { Isbn13 } from '@/store/scannerSlice.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type BookImageQueue = Isbn13[];
type BookImageResults = Record<Isbn13, string | null>;

type State = {
  // 書影URL取得処理 / キュー
  bookImageQueue: BookImageQueue;
  // 書影URL取得処理 / 処理結果
  bookImageQueueResults: BookImageResults;
};

const initialState: State = {
  bookImageQueue: [],
  bookImageQueueResults: {},
};

const checkBookImageExists = (key: Isbn13, state: State) => {
  const queue = state.bookImageQueue.includes(key);
  const result = state.bookImageQueueResults[key] !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const fetchBookImageSlice = createSlice({
  name: 'fetchBookImage',
  initialState,
  reducers: {
    enqueueBookImage: (state, action: PayloadAction<{ isbnList: Isbn13[]; type: 'new' | 'retry' | 'priority' }>) => {
      const addList = action.payload.isbnList.filter(isbn => {
        if (action.payload.type === 'new') {
          return !checkBookImageExists(isbn, state);
        } else {
          return state.bookImageQueueResults[isbn] === undefined && state.bookImageQueue.at(0) !== isbn;
        }
      });

      if (action.payload.type === 'new') {
        state.bookImageQueue.push(...addList);
      } else {
        state.bookImageQueue.splice(1, 0, ...addList);
      }
    },
    dequeueBookImage: (state, action: PayloadAction<{ isbn: Isbn13; url: string | null }[]>) => {
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
  },
});

export const { enqueueBookImage, dequeueBookImage } = fetchBookImageSlice.actions;

const _selectBookImageQueueUnUnique = (state: RootState) => state.fetchBookImage.bookImageQueue;
const _selectBookImageQueue = createSelector([_selectBookImageQueueUnUnique], bookImageQueueUnUnique =>
  bookImageQueueUnUnique.filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx)
);
/** 書影URL取得キューの中で処理対象のもの */
export const selectFetchBookImageQueueTargets = createSelector([_selectBookImageQueue], bookImageQueue =>
  bookImageQueue.slice(0, 1)
);
/** ISBNコード：書影URL のRecord */
export const selectBookImageQueueResults = (state: RootState) => state.fetchBookImage.bookImageQueueResults;

export default fetchBookImageSlice.reducer;
