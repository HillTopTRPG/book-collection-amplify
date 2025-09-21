import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { Isbn13 } from '@/types/book.ts';
import { simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
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

const checkQueueExists = (key: QueueType, state: State) => {
  const queue = state.queue.includes(key);
  const result = state.results[key] !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const fetchBookImageSlice = createSlice({
  name: 'fetchBookImage',
  initialState,
  reducers: {
    enqueueBookImage: (state, action: PayloadAction<{ isbnList: QueueType[]; type: 'new' | 'retry' | 'priority' }>) => {
      const addList = action.payload.isbnList.filter(isbn => {
        if (action.payload.type === 'new') {
          return !checkQueueExists(isbn, state);
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
      action.payload.forEach(({ isbn, url }) => {
        const existsCheck = checkQueueExists(isbn, state);
        if (!existsCheck?.queue) return;

        // キューから一致するISBNを全て削除する
        state.queue
          .flatMap((queuedIsbn, index) => (queuedIsbn === isbn ? [index] : []))
          .reverse()
          .forEach(deleteIndex => state.queue.splice(deleteIndex, 1));
        state.results[isbn] = url;
      });
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
