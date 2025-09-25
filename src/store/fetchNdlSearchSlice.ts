import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData } from '@/types/book.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { unique } from '@/utils/primitive.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/store.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NdlSearchResult = {
  list: BookData[];
  numberOfRecords: number | null;
  nextRecordPosition: number | null;
};

type QueueType = string;
type QueueResult = NdlSearchResult | 'retrying';

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// NDL検索処理
export const fetchNdlSearchSlice = createSlice({
  name: 'fetchNdlSearch',
  initialState,
  reducers: {
    enqueueNdlSearch: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'retry' | 'priority';
      }>
    ) => {
      enqueue(state, action);
    },
    dequeueNdlSearch: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
    },
  },
});

export const { enqueueNdlSearch, dequeueNdlSearch } = fetchNdlSearchSlice.actions;

const _selectQueueUnUnique = simpleSelector('fetchNdlSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchTargets = createSelector([_selectQueue], queue => queue.slice(0, 2));
/** NDL検索条件：書籍一覧 のRecord */
export const selectNdlSearchResults = simpleSelector('fetchNdlSearch', 'results');

export default fetchNdlSearchSlice.reducer;
