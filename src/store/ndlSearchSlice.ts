import type { BookData } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { makeInitialQueueState } from '@/types/queue.ts';
import { unique } from '@/utils/primitive.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/store.ts';
import { getKeys } from '@/utils/type.ts';

type QueueType = string;
type QueueResult = BookData[];

const initialState = makeInitialQueueState<QueueType, QueueResult>();

// NDL検索処理
export const ndlSearchSlice = createSlice({
  name: 'ndlSearch',
  initialState,
  reducers: {
    enqueueAllNdlSearch: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new' | 'priority';
      }>
    ) => {
      enqueue(state, action);
    },
    dequeueAllNdlSearch: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
    },
  },
});

export const { enqueueAllNdlSearch, dequeueAllNdlSearch } = ndlSearchSlice.actions;

const _selectQueueUnUnique = simpleSelector('ndlSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchTargets = createSelector([_selectQueue], queue => queue.slice(0, 2));
/** NDL検索条件：書籍一覧 のRecord */
export const selectAllNdlSearchResults = simpleSelector('ndlSearch', 'results');
export const selectFetchedAllBooks = createSelector([selectAllNdlSearchResults], results =>
  getKeys(results)
    .flatMap(option => (typeof results[option] === 'string' ? [] : results[option]))
    .filter((book, idx, self) => self.findIndex(b => b.isbn === book.isbn) === idx)
);

export default ndlSearchSlice.reducer;
