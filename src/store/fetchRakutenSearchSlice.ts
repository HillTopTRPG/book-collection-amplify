import type { BookData, Isbn13 } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { createQueueTargetSelector, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

type QueueType = Isbn13;
type QueueResult = BookData | 'retrying' | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// Rakuten Books API処理
export const fetchRakutenSearchSlice = createSlice({
  name: 'fetchRakutenSearch',
  initialState,
  reducers: {
    enqueueRakutenSearch: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'retry' | 'priority';
      }>
    ) => {
      enqueue(state, action);
    },
    dequeueRakutenSearch: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
    },
  },
});

export const { enqueueRakutenSearch, dequeueRakutenSearch } = fetchRakutenSearchSlice.actions;

// Rakuten Books APIキューの中で処理対象のもの
export const selectRakutenSearchTargets = createQueueTargetSelector('fetchRakutenSearch', 1);
// ISBNコード：Rakuten Books APIで取得した書籍データ のRecord
export const selectRakutenSearchResults = simpleSelector('fetchRakutenSearch', 'results');

export default fetchRakutenSearchSlice.reducer;
