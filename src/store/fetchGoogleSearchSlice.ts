import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type QueueType = Isbn13;
type QueueResult = BookData | 'retrying' | null;

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// 楽天 Books API処理
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

const _selectQueueUnUnique = simpleSelector('fetchGoogleSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));

// 楽天 Books APIキューの中で処理対象のもの
export const selectGoogleSearchTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// ISBNコード：楽天 Books APIで取得した書籍データ のRecord
export const selectGoogleSearchResults = simpleSelector('fetchGoogleSearch', 'results');

export default fetchGoogleSearchSlice.reducer;
