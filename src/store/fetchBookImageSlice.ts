import type { Isbn13 } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { getBookImagesToLocalStorage, pushBookImageToLocalStorage } from '@/utils/localStorage.ts';
import { createQueueTargetSelector, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

type QueueType = Isbn13;
type QueueResult = string | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>(getBookImagesToLocalStorage());

// 書影URL取得処理
export const fetchBookImageSlice = createSlice({
  name: 'fetchBookImage',
  initialState,
  reducers: {
    enqueueBookImage: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'priority';
      }>
    ) => {
      enqueue(state, action);
    },
    dequeueBookImage: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      pushBookImageToLocalStorage(action.payload);
      dequeue(state, action);
    },
  },
});

export const { enqueueBookImage, dequeueBookImage } = fetchBookImageSlice.actions;

// 書影URL取得キューの中で処理対象のもの
export const selectFetchBookImageQueueTargets = createQueueTargetSelector('fetchBookImage', 1);
// ISBNコード：書影URL のRecord
const selectFetchBookImageQueueResults = simpleSelector('fetchBookImage', 'results');

export const selectBookImageByIsbn = createSelector(
  [selectFetchBookImageQueueResults, (_state, isbn: Isbn13 | null | undefined) => isbn],
  (fetchBookImageQueueResults: Record<Isbn13, string | null>, isbn): 'retrying' | string | null | undefined => {
    if (!isbn) return undefined;
    return isbn in fetchBookImageQueueResults ? fetchBookImageQueueResults[isbn] : undefined;
  }
);

export default fetchBookImageSlice.reducer;
