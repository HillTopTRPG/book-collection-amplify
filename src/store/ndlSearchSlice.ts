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

// グローバルキャッシュをクリアする関数（ページアンマウント時に使用）
export const clearNdlSearchGlobalCache = () => {
  cachedBookDetailsRecord = {};
  previousResults = {};
  previousCollections = [];
  previousTempCollections = [];
};

export const { enqueueAllNdlSearch, dequeueAllNdlSearch } = ndlSearchSlice.actions;

const _selectQueueUnUnique = simpleSelector('ndlSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchTargets = createSelector([_selectQueue], queue => queue.slice(0, 2));
/** NDL検索条件：書籍一覧 のRecord */
export const selectAllNdlSearchResults = simpleSelector('ndlSearch', 'results');

// 配列参照を安定化するためのキャッシュ
let cachedBookDetailsRecord: Record<string, BookDetail[]> = {};
let previousResults: Record<string, BookData[]> = {};
let previousCollections: Collection[] = [];
let previousTempCollections: Collection[] = [];

// キャッシュの最大サイズ（メモリリーク防止）
const MAX_CACHE_SIZE = 50;

export const selectAllBookDetails = createSelector(
  [selectAllNdlSearchResults, selectCollections, selectTempCollections],
  (
    results: Record<string, BookData[]>,
    collections: Collection[],
    tempCollections: Collection[]
  ): Record<string, BookDetail[]> => {
    // collections が変更されていない場合、変更されたキーのみ再計算
    const collectionsChanged = collections !== previousCollections || tempCollections !== previousTempCollections;

    // 完全に同じ状態なら早期リターン（最適化）
    // previousResultsとresultsの参照比較で判定
    const resultsKeys = Object.keys(results);
    const previousKeys = Object.keys(previousResults);
    const resultsUnchanged =
      !collectionsChanged &&
      resultsKeys.length === previousKeys.length &&
      resultsKeys.every(key => key in previousResults && results[key] === previousResults[key]);

    if (resultsUnchanged) {
      return cachedBookDetailsRecord;
    }

    const currentKeys = getKeys(results);
    const newRecord: Record<string, BookDetail[]> = {};

    currentKeys.forEach(str => {
      // このキーのデータが変更されていなければキャッシュを使用
      if (!collectionsChanged && results[str] === previousResults[str] && str in cachedBookDetailsRecord) {
        newRecord[str] = cachedBookDetailsRecord[str];
      } else {
        // 変更されている場合のみ再計算
        newRecord[str] = results[str].map(book => {
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
      }
    });

    // キャッシュを更新（現在のキーのみを保持して肥大化を防ぐ）
    const newPreviousResults: Record<string, BookData[]> = {};
    currentKeys.forEach(key => {
      newPreviousResults[key] = results[key];
    });

    // キャッシュサイズが上限を超えたら古いキーを削除（LRU方式）
    const cacheKeys = Object.keys(newPreviousResults);
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      const keysToKeep = cacheKeys.slice(-MAX_CACHE_SIZE);
      const limitedPreviousResults: Record<string, BookData[]> = {};
      const limitedCachedBookDetails: Record<string, BookDetail[]> = {};

      keysToKeep.forEach(key => {
        limitedPreviousResults[key] = newPreviousResults[key];
        if (key in newRecord) {
          limitedCachedBookDetails[key] = newRecord[key];
        }
      });

      previousResults = limitedPreviousResults;
      cachedBookDetailsRecord = limitedCachedBookDetails;
    } else {
      previousResults = newPreviousResults;
      cachedBookDetailsRecord = newRecord;
    }

    previousCollections = collections;
    previousTempCollections = tempCollections;

    return newRecord;
  }
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

const EMPTY_BOOK_DETAIL_ARRAY: BookDetail[] = [];

/** 特定のキーに対応する BookDetail[] を取得するセレクター */
export const selectBookDetailsByKey = createSelector(
  [selectAllBookDetails, (_state, key: string) => key],
  (allBookDetails, key): BookDetail[] => {
    if (!key) return EMPTY_BOOK_DETAIL_ARRAY;
    if (!(key in allBookDetails)) return EMPTY_BOOK_DETAIL_ARRAY;
    const result = allBookDetails[key];

    return typeof result === 'string' ? EMPTY_BOOK_DETAIL_ARRAY : result;
  }
);

/** 特定のコレクションIDに対応する FilterResult を取得するセレクター */
export const selectFilterResultsByCollectionId = createSelector(
  [selectAllFilterResults, (_state, collectionId: string) => collectionId],
  (allFilterResults, collectionId): { filterSet: FilterSet; books: BookDetail[] } | null => {
    if (!allFilterResults) return null;
    return allFilterResults.find(({ filterSet }) => filterSet.collectionId === collectionId) ?? null;
  }
);

/** 特定のISBNに関連する FilterResults を取得するセレクター */
export const selectFilterResultsByIsbn = createSelector(
  [
    selectAllFilterResults,
    (_state, isbn: string) => isbn,
    (_state, _isbn: string, excludeCollectionId?: string) => excludeCollectionId,
  ],
  (allFilterResults, isbn, excludeCollectionId): { filterSet: FilterSet; books: BookDetail[] }[] => {
    if (!allFilterResults) return [];
    return allFilterResults.filter(
      ({ filterSet, books }) =>
        filterSet.collectionId !== excludeCollectionId && books.some(({ book }) => book.isbn === isbn)
    );
  }
);

export default ndlSearchSlice.reducer;
