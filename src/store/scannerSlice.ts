import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import {
  createSimpleReducers,
  deleteAllString,
  makeNdlOptionsStringByNdlFullOptions,
  simpleSelector,
} from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import type { PickRequired } from '@/utils/type.ts';
import { checkQueueExists } from '@/utils/validate.ts';
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

export type ScannedItemRecord = Record<Isbn13, ScannedItemMapValue | null>;

type State = {
  // 読み込み処理 / キュー
  queue: Isbn13[];
  // 読み込み処理 / 処理結果
  results: ScannedItemRecord;
  // 読み込み処理 / 表示
  queueViewList: Isbn13[];
  // 選択された読み込み結果
  selectedIsbn: Isbn13 | null;
};

const initialState: State = {
  queue: [],
  results: {},
  queueViewList: [],
  selectedIsbn: null,
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    enqueueScan: (state, action: PayloadAction<{ isbnList: Isbn13[]; type: 'new' }>) => {
      const addList = action.payload.isbnList.filter(isbn => !checkQueueExists(isbn, state.queue, state.results));
      state.queue.push(...addList);
      state.queueViewList.push(...addList);
    },
    dequeueScan: (
      state,
      action: PayloadAction<{ list: { isbn: Isbn13; result: ScannedItemMapValue | null }[]; retryList: Isbn13[] }>
    ) => {
      action.payload.list.forEach(({ isbn, result }) => {
        const existsCheck = checkQueueExists(isbn, state.queue, state.results);
        if (!existsCheck?.queue) return;

        // キューから一致するISBNを全て削除する
        deleteAllString(state.queue, isbn);
        state.results[isbn] = result;

        // 書籍情報が取得できなければ表示から消す
        if (!result) {
          deleteAllString(state.queueViewList, isbn);
        }
      });
    },
    clearScanViewList: state => {
      state.queueViewList.splice(0, state.queueViewList.length);
    },
    deleteScanViewList: (state, action: PayloadAction<Isbn13>) => {
      const isbn = action.payload;
      deleteAllString(state.queueViewList, isbn);
      deleteAllString(state.queue, isbn);
    },
    updateFetchedFetchOption: (
      state,
      action: PayloadAction<{ isbn: Isbn13; filterSetIndex: number; fetch: NdlFullOptions }>
    ) => {
      const scanningItemMapValue = state.results[action.payload.isbn];
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.filterSetIndex) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.filterSetIndex];
      filterSet.fetch = action.payload.fetch;
      scanningItemMapValue.filterSets.splice(action.payload.filterSetIndex, 1, filterSet);
    },
    updateFetchedFilterAnywhere: (state, action: PayloadAction<{ isbn: Isbn13; index: number; anywhere: string }>) => {
      const scanningItemMapValue = state.results[action.payload.isbn];
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.index) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.index];
      const anywhere = action.payload.anywhere;
      const addFilter = { anywhere };
      if (!filterSet.filters.length) filterSet.filters.push([]);
      filterSet.filters[0].splice(0, 1, addFilter);
    },
    updateSelectedScanIsbn: createSimpleReducers('selectedIsbn'),
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
