import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/FilterSets/NdlOptionsForm.tsx';
import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterAndGroup, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import type { QueueState } from '@/types/queue.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { deleteAllStrings, makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import {
  deleteScannedIsbnToLocalStorage,
  pushScannedIsbnToLocalStorage,
  resetScannedIsbnToLocalStorage,
} from '@/utils/localStorage.ts';
import { unique } from '@/utils/primitive.ts';
import { dequeue, enqueue, createSimpleReducers, simpleSelector } from '@/utils/store.ts';
import type { PickRequired } from '@/utils/type.ts';
import { getKeys } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ScanningItemMapValue = {
  isbn: Isbn13;
  status: 'loading' | 'new' | 'collection';
  collectionId: string | null;
  bookDetail: BookDetail | null;
  filterSets: FilterSet[];
};
export type ScannedItemMapValue = Omit<ScanningItemMapValue, 'bookDetail'> & {
  bookDetail: PickRequired<BookDetail, 'book'> | null;
};

type QueueType = Isbn13;
type QueueResult = ScannedItemMapValue | null;

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
    updateFetchedFetchOption: (
      state,
      action: PayloadAction<{ isbn: QueueType; filterSetId: string; fetch: NdlFullOptions }>
    ) => {
      const scanningItemMapValue = state.results[action.payload.isbn];
      if (!scanningItemMapValue) return;
      const filterSet = scanningItemMapValue.filterSets.find(({ id }) => id === action.payload.filterSetId);
      if (!filterSet) return;
      filterSet.fetch = action.payload.fetch;
    },
    updateFetchedFilterAnywhere: (
      state,
      action: PayloadAction<{ key: QueueType; filterSetId: string; filters: FilterAndGroup[] }>
    ) => {
      const scanningItemMapValue = state.results[action.payload.key];
      if (!scanningItemMapValue) return;
      const filterSet = scanningItemMapValue.filterSets.find(({ id }) => id === action.payload.filterSetId);
      if (!filterSet) return;
      filterSet.filters = action.payload.filters;
    },
    updateSelectedScanIsbn: createSimpleReducers('selectedIsbn'),
  },
});

export const {
  enqueueScan,
  dequeueScan,
  clearScanViewList,
  updateSelectedScanIsbn,
  updateFetchedFetchOption,
  updateFetchedFilterAnywhere,
} = scannerSlice.actions;

const _selectQueueUnUnique = simpleSelector('scanner', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
const _selectScanQueueResults = simpleSelector('scanner', 'results');
const _selectScanQueueViewList = simpleSelector('scanner', 'queueViewList');
const _selectSelectedIsbn = simpleSelector('scanner', 'selectedIsbn');

// スキャンキューの中で処理対象のもの
export const selectScanQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// スキャン中に表示するデータの整形済データ
export const selectScanResultList = createSelector(
  [_selectScanQueueViewList, _selectScanQueueResults],
  (viewList, results): { isbn: Isbn13; status: 'loading' | 'none' | 'done'; result: ScannedItemMapValue | null }[] =>
    unique(viewList).map(isbn => {
      if (results[isbn] === undefined) return { isbn, status: 'loading' as const, result: null };
      return { isbn, status: !results[isbn] ? ('none' as const) : ('done' as const), result: results[isbn] };
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
  (scanResultList, selectedIsbn): PickRequired<ScannedItemMapValue, 'bookDetail'> | null => {
    if (!selectedIsbn) return null;
    return (scanResultList.find(
      scanResult => scanResult.isbn === selectedIsbn && Boolean(scanResult.result?.bookDetail)
    )?.result ?? null) as PickRequired<ScannedItemMapValue, 'bookDetail'> | null;
  }
);
// BookDetailDrawerで表示されている検索条件フォームの値（変化するたびにNDL検索キューにenqueueする）
export const selectSelectedScannedItemFetchOptions = createSelector(
  [selectSelectedScannedItemMapValue],
  selectedScannedItemMapValue =>
    selectedScannedItemMapValue?.filterSets.map(filterSet => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)) ||
    []
);

export default scannerSlice.reducer;
