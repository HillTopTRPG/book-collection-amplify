import type { Isbn13 } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { unique } from '@/utils/primitive.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

type QueueType = Isbn13;
type QueueResult = string | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>();

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
      dequeue(state, action);
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
