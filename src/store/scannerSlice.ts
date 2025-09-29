import type { BookData, BookDetail, Isbn13 } from '@/types/book.ts';
import type { QueueState } from '@/types/queue.ts';
import type { IdInfo } from '@/types/system.ts';
import type { PickRequired } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { selectAllNdlSearchResults } from '@/store/ndlSearchSlice.ts';
import {
  selectCollections,
  selectFilterSets,
  selectTempCollections,
  selectTempFilterSets,
} from '@/store/subscriptionDataSlice.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { getScannedItemMapValueByBookData, makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import {
  deleteScannedIsbnToLocalStorage,
  pushScannedIsbnToLocalStorage,
  resetScannedIsbnToLocalStorage,
} from '@/utils/localStorage.ts';
import { deleteAllStrings, filterMatch, unique } from '@/utils/primitive.ts';
import { createSimpleReducers, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';
import { getKeys } from '@/utils/type.ts';

export type ScanningItemMapValue = {
  isbn: Isbn13;
  bookDetail: BookDetail | null;
  filterSets: IdInfo[];
};
export type ScannedItemMapValue = PickRequired<ScanningItemMapValue, 'bookDetail'>;

type QueueType = Isbn13;
type QueueResult = BookData | null;

type State = QueueState<QueueType, QueueResult> & {
  // 読み込み処理 / 表示
  queueViewList: QueueType[];
  // 選択された読み込み結果
  selectedIsbn: QueueType | null;
};

const initialState: State = {
  ...makeInitialQueueState<QueueType, QueueResult>(),
  queueViewList: [],
  selectedIsbn: null,
} as const;

// 読み込み処理
export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    enqueueScan: (
      state,
      action: PayloadAction<{
        list: QueueType[];
        type: 'new';
      }>
    ) => {
      const addList = enqueue(state, action);
      state.queueViewList.push(...addList);
      // localStorageにも反映
      pushScannedIsbnToLocalStorage(action.payload.list);
    },
    dequeueScan: (state, action: PayloadAction<Record<QueueType, QueueResult>>) => {
      dequeue(state, action);
      const deleteIsbnList = getKeys(action.payload).filter(isbn => !action.payload[isbn]);
      deleteAllStrings(state.queueViewList, deleteIsbnList);
      // localStorageにも反映
      deleteScannedIsbnToLocalStorage(deleteIsbnList);
    },
    clearScanViewList: state => {
      state.queueViewList.splice(0, state.queueViewList.length);
      // localStorageにも反映
      resetScannedIsbnToLocalStorage();
    },
    updateSelectedScanIsbn: createSimpleReducers('selectedIsbn'),
  },
});

export const { enqueueScan, dequeueScan, clearScanViewList, updateSelectedScanIsbn } = scannerSlice.actions;

const _selectQueueUnUnique = simpleSelector('scanner', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
const _selectScanQueueResults = simpleSelector('scanner', 'results');
const _selectScanQueueViewList = simpleSelector('scanner', 'queueViewList');
const _selectSelectedIsbn = simpleSelector('scanner', 'selectedIsbn');

// スキャンキューの中で処理対象のもの
export const selectScanQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// スキャン中に表示するデータの整形済データ
export const selectScanResultList = createSelector(
  [
    _selectScanQueueViewList,
    _selectScanQueueResults,
    selectCollections,
    selectTempCollections,
    selectFilterSets,
    selectTempFilterSets,
    selectAllNdlSearchResults,
  ],
  (
    viewList,
    results,
    collections,
    tempCollections,
    dbFilterSets,
    tempFilterSets,
    allNdlSearchResults
  ): { isbn: Isbn13; status: 'loading' | 'none' | 'done'; result: ScannedItemMapValue | null }[] =>
    unique(viewList).map(isbn => {
      if (results[isbn] === undefined) return { isbn, status: 'loading' as const, result: null };
      const book: BookData | null = results[isbn];

      if (!book) {
        return {
          isbn,
          status: 'none' as const,
          result: null,
        };
      }

      const { scannedItemMapValue } = getScannedItemMapValueByBookData(
        book,
        collections,
        tempCollections,
        dbFilterSets,
        tempFilterSets,
        allNdlSearchResults
      );

      return {
        isbn,
        status: 'done' as const,
        result: scannedItemMapValue,
      };
    })
);

// スキャン成功件数（スキャン成功音を鳴らすための数値）
export const selectScanSuccessCount = createSelector(
  [selectScanResultList],
  (scanResultList): number => scanResultList.filter(({ status }) => status === 'done').length
);
// BookDetailDrawerに表示するデータ
export const selectSelectedScannedItemMapValue = createSelector(
  [selectScanResultList, _selectSelectedIsbn],
  (scanResultList, selectedIsbn): ScannedItemMapValue | null => {
    if (!selectedIsbn) return null;
    return (scanResultList.find(
      scanResult => scanResult.isbn === selectedIsbn && Boolean(scanResult.result?.bookDetail)
    )?.result ?? null) as ScannedItemMapValue | null;
  }
);
// BookDetailDrawerで表示されている検索条件フォームの値（変化するたびにNDL検索キューにenqueueする）
export const selectSelectedScannedItemFetchOptions = createSelector(
  [selectSelectedScannedItemMapValue, selectFilterSets, selectTempFilterSets],
  (selectedScannedItemMapValue, filterSets, tempFilterSets) =>
    selectedScannedItemMapValue?.filterSets.map(({ id, type }) => {
      const filterSet = (type === 'db' ? filterSets : tempFilterSets).find(filterMatch({ id }))!;

      return makeNdlOptionsStringByNdlFullOptions(filterSet.fetch);
    }) || []
);

export default scannerSlice.reducer;
