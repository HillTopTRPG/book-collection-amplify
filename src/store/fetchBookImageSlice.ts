import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { Isbn13 } from '@/types/book.ts';
import { deleteAllStrings, simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';
import { checkQueueExists } from '@/utils/validate.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type QueueType = Isbn13;
type QueueResult = string | null;

type State = {
  // 書影URL取得処理 / キュー
  queue: QueueType[];
  // 書影URL取得処理 / 処理結果
  results: Record<QueueType, QueueResult>;
};

const initialState: State = {
  queue: [],
  results: {},
};

export const fetchBookImageSlice = createSlice({
  name: 'fetchBookImage',
  initialState,
  reducers: {
    enqueueBookImage: (state, action: PayloadAction<{ isbnList: QueueType[]; type: 'new' | 'retry' | 'priority' }>) => {
      const addList = action.payload.isbnList.filter(isbn => {
        if (action.payload.type === 'new') {
          return !checkQueueExists(isbn, state.queue, state.results);
        } else {
          return state.results[isbn] === 'retrying' && state.queue.at(0) !== isbn;
        }
      });

      if (action.payload.type === 'new') {
        state.queue.push(...addList);
      } else {
        state.queue.splice(1, 0, ...addList);
      }
    },
    dequeueBookImage: (state, action: PayloadAction<{ isbn: QueueType; url: QueueResult }[]>) => {
      const results = action.payload.reduce<Record<QueueType, QueueResult | null>>((acc, { isbn, url }) => {
        const existsCheck = checkQueueExists(isbn, state.queue, state.results);
        if (!existsCheck?.queue) return acc;

        acc[isbn] = url;
        return acc;
      }, {});

      // 結果を格納する
      state.results = { ...state.results, ...results };
      // キューから一致するISBNを全て削除する
      deleteAllStrings(state.queue, getKeys(results));
    },
  },
});

export const { enqueueBookImage, dequeueBookImage } = fetchBookImageSlice.actions;

const _selectQueueUnUnique = simpleSelector('fetchBookImage', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));

// 書影URL取得キューの中で処理対象のもの
export const selectFetchBookImageQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// ISBNコード：書影URL のRecord
export const selectFetchBookImageQueueResults = simpleSelector('fetchBookImage', 'results');

export default fetchBookImageSlice.reducer;
