import type { BookData, Isbn13 } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { createQueueTargetSelector, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

type QueueType = Isbn13;
type QueueResult = BookData | 'retrying' | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// Google Books API処理
export const fetchGoogleSearchSlice = createSlice({
  name: 'fetchGoogleSearch',
  initialState,
  reducers: {
    enqueueGoogleSearch: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'retry' | 'priority';
      }>
    ) => {
      enqueue(state, action);
    },
    dequeueGoogleSearch: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
    },
  },
});

export const { enqueueGoogleSearch, dequeueGoogleSearch } = fetchGoogleSearchSlice.actions;

// Google Books APIキューの中で処理対象のもの
export const selectGoogleSearchTargets = createQueueTargetSelector('fetchGoogleSearch', 1);
// ISBNコード：Google Books APIで取得した書籍データ のRecord
export const selectGoogleSearchResults = simpleSelector('fetchGoogleSearch', 'results');

export default fetchGoogleSearchSlice.reducer;
