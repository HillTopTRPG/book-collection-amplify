import type { BookData } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { createQueueTargetSelector, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

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

/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchTargets = createQueueTargetSelector('fetchNdlSearch', 1);
/** NDL検索条件：書籍一覧 のRecord */
export const selectNdlSearchResults = simpleSelector('fetchNdlSearch', 'results');

export default fetchNdlSearchSlice.reducer;
