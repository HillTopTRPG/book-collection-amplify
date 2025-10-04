import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { BookData, CollectionBook, FilterResultSet, Isbn13 } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { DEFAULT_COLLECTION, selectAllFilterSets, selectCollections } from '@/store/subscriptionDataSlice.ts';
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

export const selectIsbnByApiId = createSelector(
  [selectAllNdlSearchResults, (_state, apiId: string) => apiId],
  (allNdlSearchResults, apiId): Isbn13 | null => {
    for (const key of getKeys(allNdlSearchResults)) {
      const isbn = allNdlSearchResults[key].find(filterMatch({ apiId }))?.isbn;
      if (isbn) return isbn;
    }
    return null;
  }
);

export const selectFilterResultSetsByApiId = createSelector(
  [selectAllFilterSets, selectAllNdlSearchResults, selectCollections, (_state, apiId: string) => apiId],
  (
    allFilters,
    allBooks,
    collections,
    apiId
  ): { hasPrime: boolean; priorityFetchList: string[]; filterResultSets: FilterResultSet[] | null } => {
    const priorityFetchList: string[] = [];
    const filterResultSets: FilterResultSet[] = [];
    let hasPrime: boolean = false;
    allFilters.forEach(filterSet => {
      const key = makeNdlOptionsStringByNdlFullOptions(filterSet.fetch);
      if (!(key in allBooks)) {
        priorityFetchList.push(makeNdlOptionsStringByNdlFullOptions(filterSet.fetch));
        return;
      }
      const books: BookData[] = allBooks[key];
      const collectionBooks: CollectionBook[] = books.map(book => {
        const { apiId } = book;
        const collection = collections.find(filterMatch({ apiId })) ?? DEFAULT_COLLECTION;

        // 唯一プロパティが被っているのは apiId のみ
        return { ...collection, ...book };
      });

      if (filterSet.apiId === apiId) {
        hasPrime = true;
        filterResultSets.unshift({ filterSet, collectionBooks });
      } else {
        filterResultSets.push({ filterSet, collectionBooks });
      }
    });

    return { hasPrime, priorityFetchList, filterResultSets };
  }
);

export const selectCollectionBooksByFetch = createSelector(
  [selectAllNdlSearchResults, selectCollections, (_state, fetch: NdlFullOptions) => fetch],
  (allNdlSearchResults, collections, fetch): CollectionBook[] | null => {
    const key = makeNdlOptionsStringByNdlFullOptions(fetch);
    if (!(key in allNdlSearchResults)) return null;
    const books: BookData[] = allNdlSearchResults[key];

    return books.map(book => {
      const { apiId } = book;
      const collection = collections.find(filterMatch({ apiId })) ?? DEFAULT_COLLECTION;

      // 唯一プロパティが被っているのは apiId のみ
      return { ...collection, ...book };
    });
  }
);

export default ndlSearchSlice.reducer;
