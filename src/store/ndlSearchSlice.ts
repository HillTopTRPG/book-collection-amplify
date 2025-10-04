import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { BookData, CollectionBook, FilterResultSet, FilterSet } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { DEFAULT_COLLECTION, selectAllFilterSets, selectCollections } from '@/store/subscriptionDataSlice.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import { filterMatch, unique } from '@/utils/primitive.ts';
import { dequeue, enqueue, simpleSelector } from '@/utils/store.ts';

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

export const selectAllFilterResults = createSelector(
  [selectAllFilterSets, selectAllNdlSearchResults],
  (allFilters, allBooks): { filterSet: FilterSet; books: BookData[] }[] | null => {
    const list: { filterSet: FilterSet; books: BookData[] }[] = allFilters.flatMap(filterSet => {
      const key = makeNdlOptionsStringByNdlFullOptions(filterSet.fetch);
      if (!(key in allBooks)) return [];
      return [{ filterSet, books: allBooks[key] }];
    });
    if (list.length !== allFilters.length) return null;
    return list;
  }
);

const EMPTY_BOOK_DETAIL_ARRAY: BookData[] = [];

/** 特定のキーに対応する Book[] を取得するセレクター */
export const selectBooksByKeys = createSelector(
  [selectAllNdlSearchResults, (_state, keys: string[]) => keys],
  (allBooks: Record<string, BookData[]>, keys): BookData[] => {
    if (!keys.length) return EMPTY_BOOK_DETAIL_ARRAY;
    return keys.flatMap(key => {
      if (!(key in allBooks)) return EMPTY_BOOK_DETAIL_ARRAY;
      return allBooks[key];
    });
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

      filterResultSets.push({ filterSet, collectionBooks });
    });
    const hasPrime = filterResultSets.some(({ filterSet }) => filterSet.apiId === apiId);

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
