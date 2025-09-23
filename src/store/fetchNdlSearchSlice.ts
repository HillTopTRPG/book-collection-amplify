import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData } from '@/types/book.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type QueueType = string;
type QueueResult = BookData[] | 'retrying';

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
export const selectFetchedAllBooks = createSelector([selectNdlSearchResults], results =>
  getKeys(results)
    .flatMap(option => (typeof results[option] === 'string' ? [] : results[option]))
    .filter((book, idx, self) => self.findIndex(b => b.isbn === book.isbn) === idx)
);

export default fetchNdlSearchSlice.reducer;
