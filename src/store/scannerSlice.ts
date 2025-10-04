import type { BookData, BookStatus, Isbn13 } from '@/types/book.ts';
import type { QueueState } from '@/types/queue.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { selectTempFilterSets } from '@/store/subscriptionDataSlice.ts';
import { makeInitialQueueState } from '@/types/queue.ts';
import { makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import {
  deleteScannedIsbnToLocalStorage,
  pushScannedIsbnToLocalStorage,
  resetScannedIsbnToLocalStorage,
} from '@/utils/localStorage.ts';
import { deleteAllStrings, filterMatch, unique } from '@/utils/primitive.ts';
import { createSimpleReducers, dequeue, enqueue, simpleSelector } from '@/utils/store.ts';
import { getKeys } from '@/utils/type.ts';

type QueueType = Isbn13;
type QueueResult = BookData | null;

type State = QueueState<QueueType, QueueResult> & {
  // 読み込み処理 / 表示
  queueViewList: QueueType[];
  // 選択された読み込み結果
  selectedIsbn: QueueType | null;
  checkBookStatusList: BookStatus[];
};

const initialState: State = {
  ...makeInitialQueueState<QueueType, QueueResult>(),
  queueViewList: [],
  selectedIsbn: null,
  checkBookStatusList: ['Unregistered', 'NotBuy', 'Hold', 'Planned', 'Owned'],
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
    updateCheckBookStatusList: (state, action: PayloadAction<{ type: 'add' | 'delete'; status: BookStatus }>) => {
      const { type, status } = action.payload;
      if (type === 'add') {
        state.checkBookStatusList.push(status);
        return;
      }
      state.checkBookStatusList
        .flatMap((v, idx) => (v === status ? [idx] : []))
        .reverse()
        .forEach(idx => state.checkBookStatusList.splice(idx, 1));
    },
    updateSelectedScanIsbn: createSimpleReducers('selectedIsbn'),
  },
});

export const { enqueueScan, dequeueScan, clearScanViewList, updateSelectedScanIsbn, updateCheckBookStatusList } =
  scannerSlice.actions;

const _selectQueueUnUnique = simpleSelector('scanner', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
const _selectScanQueueResults = simpleSelector('scanner', 'results');
const _selectScanQueueViewList = simpleSelector('scanner', 'queueViewList');
const _selectSelectedIsbn = simpleSelector('scanner', 'selectedIsbn');
export const selectCheckBookStatusList = simpleSelector('scanner', 'checkBookStatusList');

// スキャンキューの中で処理対象のもの
export const selectScanQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 1));
// スキャン中に表示するデータの整形済データ
export const selectScanResultList = createSelector(
  [_selectScanQueueViewList, _selectScanQueueResults],
  (viewList, results): { isbn: Isbn13; status: 'loading' | 'none' | 'done'; book: BookData | null }[] =>
    unique(viewList).map(isbn => {
      if (!(isbn in results)) return { isbn, status: 'loading' as const, book: null };
      const book: BookData | null = results[isbn];

      return { isbn, status: book ? 'done' : 'none', book };
    })
);

// スキャン成功件数（スキャン成功音を鳴らすための数値）
export const selectScanSuccessCount = createSelector(
  [selectScanResultList],
  (scanResultList): number => scanResultList.filter(({ status }) => status === 'done').length
);
// BookDrawerに表示するデータ
export const selectSelectedBookData = createSelector(
  [selectScanResultList, _selectSelectedIsbn],
  (scanResultList, selectedIsbn): BookData | null => {
    if (!selectedIsbn) return null;
    return (scanResultList.find(scanResult => scanResult.isbn === selectedIsbn && Boolean(scanResult.book))?.book ??
      null) as BookData | null;
  }
);

const EMPTY_STRINGS: string[] = [];
// BookDrawerで表示されている検索条件フォームの値（変化するたびにNDL検索キューにenqueueする）
export const selectSelectedScannedItemFetchOptions = createSelector(
  [selectSelectedBookData, selectTempFilterSets],
  (selectedBookData, tempFilterSets): string[] => {
    const apiId = selectedBookData?.apiId;
    if (!apiId) return EMPTY_STRINGS;
    return tempFilterSets
      .filter(filterMatch({ apiId }))
      .map(filterSet => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch));
  }
);

export default scannerSlice.reducer;
