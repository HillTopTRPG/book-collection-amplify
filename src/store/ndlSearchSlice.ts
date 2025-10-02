import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, BookDetail } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { selectAllFilterSets, selectCollections, selectTempCollections } from '@/store/subscriptionDataSlice.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import { filterMatch, unique } from '@/utils/primitive.ts';
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
export const selectAllBookDetails = createSelector(
  [selectAllNdlSearchResults, selectCollections, selectTempCollections],
  (
    results: Record<string, BookData[]>,
    collections: Collection[],
    tempCollections: Collection[]
  ): Record<string, BookDetail[]> =>
    getKeys(results).reduce<Record<string, BookDetail[]>>((acc, str) => {
      acc[str] = results[str].map(book => {
        const isbn = book.isbn;
        const collection = collections.find(filterMatch({ isbn }));
        const tempCollection = tempCollections.find(filterMatch({ isbn }));

        return {
          book,
          collection: {
            type: collection ? 'db' : 'temp',
            id: collection?.id ?? tempCollection?.id ?? '',
          },
        } as const satisfies BookDetail;
      });
      return acc;
    }, {})
);
export const selectFetchedAllBooks = createSelector([selectAllBookDetails], (results): BookDetail[] =>
  getKeys(results)
    .flatMap(option => (typeof results[option] === 'string' ? [] : results[option]))
    .filter((bookDetail, idx, self) => self.findIndex(b => b.book.isbn === bookDetail.book.isbn) === idx)
);
export const selectAllFilterResults = createSelector(
  [selectAllFilterSets, selectAllBookDetails],
  (allFilters, allBookDetails): { filterSet: FilterSet; books: BookDetail[] }[] | null => {
    const list: { filterSet: FilterSet; books: BookDetail[] }[] = allFilters.flatMap(filterSet => {
      const key = makeNdlOptionsStringByNdlFullOptions(filterSet.fetch);
      if (!(key in allBookDetails)) return [];
      return [{ filterSet, books: allBookDetails[key] }];
    });
    if (list.length !== allFilters.length) return null;
    return list;
  }
);

export default ndlSearchSlice.reducer;
