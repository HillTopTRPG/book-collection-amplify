import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { PickRequired } from '@/utils/type.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export type Isbn13 = string & { readonly __brand: 'Isbn13' };

export type ScanningItemMapValue = {
  isbn: Isbn13;
  status: 'loading' | 'new' | 'collection';
  collectionId: string | null;
  bookDetail: BookDetail | null;
  filterSets: FilterSet[];
};
export type ScanFinishedItemMapValue = Omit<ScanningItemMapValue, 'bookDetail'> & {
  bookDetail: PickRequired<BookDetail, 'book'> | null;
};

export type ScannedItemRecord = Record<Isbn13, ScanFinishedItemMapValue | null>;

type State = {
  // 読み込み処理 / キュー
  scanQueue: Isbn13[];
  // 読み込み処理 / 処理結果
  scanQueueResults: ScannedItemRecord;
  // 読み込み処理 / 表示
  scanQueueViewList: Isbn13[];
  selectedIsbn: Isbn13 | null;
};

const initialState: State = {
  scanQueue: [],
  scanQueueResults: {},
  scanQueueViewList: [],
  selectedIsbn: null,
};

const checkScanExists = (key: Isbn13, state: State) => {
  const queue = state.scanQueue.includes(key);
  const result = state.scanQueueResults[key] !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    enqueueScan: (state, action: PayloadAction<{ isbnList: Isbn13[]; type: 'new' }>) => {
      const addList = action.payload.isbnList.filter(isbn => !checkScanExists(isbn, state));
      state.scanQueue.push(...addList);
      state.scanQueueViewList.push(...addList);
    },
    dequeueScan: (
      state,
      action: PayloadAction<{ list: { isbn: Isbn13; result: ScanFinishedItemMapValue | null }[]; retryList: Isbn13[] }>
    ) => {
      action.payload.list.forEach(({ isbn, result }) => {
        const existsCheck = checkScanExists(isbn, state);
        if (!existsCheck?.queue) return;

        // キューから一致するISBNを全て削除する
        state.scanQueue
          .flatMap((queuedIsbn, index) => (queuedIsbn === isbn ? [index] : []))
          .reverse()
          .forEach(deleteIndex => state.scanQueue.splice(deleteIndex, 1));
        state.scanQueueResults[isbn] = result;
      });
    },
    clearScanViewList: state => {
      state.scanQueueViewList.splice(0, state.scanQueueViewList.length);
    },
    deleteScanViewList: (state, action: PayloadAction<Isbn13>) => {
      const isbn = action.payload;
      state.scanQueueViewList
        .flatMap((queuedIsbn, index) => (queuedIsbn === isbn ? [index] : []))
        .reverse()
        .forEach(deleteIndex => state.scanQueue.splice(deleteIndex, 1));
      state.scanQueue
        .flatMap((queuedIsbn, index) => (queuedIsbn === isbn ? [index] : []))
        .reverse()
        .forEach(deleteIndex => state.scanQueue.splice(deleteIndex, 1));
    },
    updateFetchedFetchOption: (
      state,
      action: PayloadAction<{ isbn: Isbn13; index: number; fetch: NdlFullOptions }>
    ) => {
      const scanningItemMapValue = state.scanQueueResults[action.payload.isbn];
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.index) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.index];
      filterSet.fetch = action.payload.fetch;
      scanningItemMapValue.filterSets.splice(action.payload.index, 1, filterSet);
    },
    updateFetchedFilterAnywhere: (state, action: PayloadAction<{ isbn: Isbn13; index: number; anywhere: string }>) => {
      const scanningItemMapValue = state.scanQueueResults[action.payload.isbn];
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.index) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.index];
      const anywhere = action.payload.anywhere;
      const addFilter = { anywhere };
      if (!filterSet.filters.length) filterSet.filters.push([]);
      filterSet.filters[0].splice(0, 1, addFilter);
    },
    updateSelectedScanIsbn: (state, action: PayloadAction<Isbn13 | null>) => {
      state.selectedIsbn = action.payload;
    },
  },
});

export const {
  enqueueScan,
  dequeueScan,
  clearScanViewList,
  deleteScanViewList,
  updateSelectedScanIsbn,
  updateFetchedFetchOption,
  updateFetchedFilterAnywhere,
} = scannerSlice.actions;

const _selectScanQueueUnUnique = (state: RootState) => state.scanner.scanQueue;
const _selectScanQueue = createSelector([_selectScanQueueUnUnique], scanQueueUnUnique =>
  scanQueueUnUnique.filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx)
);
/** スキャンキューの中で処理対象のもの */
export const selectScanQueueTargets = createSelector([_selectScanQueue], scanQueue => scanQueue.slice(0, 1));
const _selectScanQueueResults = (state: RootState) => state.scanner.scanQueueResults;
const _selectScanQueueViewList = (state: RootState) => state.scanner.scanQueueViewList;
export const selectScanResultList = createSelector(
  [_selectScanQueueViewList, _selectScanQueueResults],
  (
    viewList,
    results
  ): { isbn: Isbn13; status: 'loading' | 'none' | 'done'; result: ScanFinishedItemMapValue | null }[] =>
    viewList
      .filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx)
      .map(isbn => {
        if (results[isbn] === undefined) return { isbn, status: 'loading' as const, result: null };
        return { isbn, status: !results[isbn] ? ('none' as const) : ('done' as const), result: results[isbn] };
      })
);
const selectSelectedIsbn = (state: RootState) => state.scanner.selectedIsbn;
export const selectScannedBookDetails = createSelector(
  [selectScanResultList],
  (scanResultList): number => scanResultList.filter(({ status }) => status === 'done').length
);
export const selectSelectedScannedItemMapValue = createSelector(
  [selectScanResultList, selectSelectedIsbn],
  (scanResultList, selectedIsbn): PickRequired<ScanFinishedItemMapValue, 'bookDetail'> | null => {
    if (!selectedIsbn) return null;
    return (scanResultList.find(
      scanResult => scanResult.isbn === selectedIsbn && Boolean(scanResult.result?.bookDetail)
    )?.result ?? null) as PickRequired<ScanFinishedItemMapValue, 'bookDetail'> | null;
  }
);
export const selectSelectedScannedItemFetchOptions = createSelector(
  [selectSelectedScannedItemMapValue],
  selectedScannedItemMapValue =>
    selectedScannedItemMapValue?.filterSets.map(filterSet => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)) ||
    []
);

export default scannerSlice.reducer;
