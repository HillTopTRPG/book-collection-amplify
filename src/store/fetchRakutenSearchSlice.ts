import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type QueueType = Isbn13;
type QueueResult = BookData | string | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// Google Books API処理
export const fetchRakutenSearchSlice = createSlice({
  name: 'fetchGoogleSearch',
  initialState,
  reducers: {
    enqueueRakutenSearch: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'retry' | 'priority';
      }>
    ) => {
      enqueue(state, action, result => result === 'retrying');
    },
    dequeueRakutenSearch: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
    },
  },
});

export const { enqueueRakutenSearch, dequeueRakutenSearch } = fetchRakutenSearchSlice.actions;

const _selectQueueUnUnique = simpleSelector('fetchRakutenSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));

// Google Books APIキューの中で処理対象のもの
export const selectRakutenSearchQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// ISBNコード：Google Books APIで取得した書籍データ のRecord
export const selectRakutenSearchQueueResults = simpleSelector('fetchRakutenSearch', 'results');

export default fetchRakutenSearchSlice.reducer;
