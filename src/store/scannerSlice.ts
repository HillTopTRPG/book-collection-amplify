import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { NdlOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { PickRequired } from '@/utils/type.ts';
import { getKeys } from '@/utils/type.ts';
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

export type ScanningItemMap = Map<Isbn13, ScanningItemMapValue>;

type State = {
  scanningItemMap: ScanningItemMap;
  selectedIsbn: Isbn13 | null;
};

const initialState: State = {
  scanningItemMap: new Map<Isbn13, ScanningItemMapValue>(),
  selectedIsbn: null,
};

export const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    /** スキャン・手入力して得られたISBNコードを登録し、APIで書籍データを取得するキューに登録するための処理 */
    addScannedIsbn: (state, action: PayloadAction<Isbn13>) => {
      const isbn = action.payload;
      state.scanningItemMap.set(isbn, {
        isbn,
        status: 'loading',
        collectionId: null,
        bookDetail: null,
        filterSets: [],
      });
    },
    /** APIで取得した書籍データを登録する処理 */
    setFetchedBookData: (state, action: PayloadAction<Record<Isbn13, ScanFinishedItemMapValue>>) => {
      for (const isbn13 of getKeys(action.payload)) {
        const item = state.scanningItemMap.get(isbn13);
        if (!item) continue;
        const value = action.payload[isbn13];
        item.status = value.status;
        item.collectionId = value.collectionId;
        item.bookDetail = value.bookDetail;
        item.filterSets = value.filterSets;
      }
    },
    updateFetchedFetchOption: (
      state,
      action: PayloadAction<{ isbn: Isbn13; index: number; fetch: NdlOptions & { creator: string; publisher: string } }>
    ) => {
      const scanningItemMapValue = state.scanningItemMap.get(action.payload.isbn);
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.index) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.index];
      filterSet.fetch = action.payload.fetch;
      scanningItemMapValue.filterSets.splice(action.payload.index, 1, filterSet);
    },
    updateFetchedFilterAnywhere: (state, action: PayloadAction<{ isbn: Isbn13; index: number; anywhere: string }>) => {
      const scanningItemMapValue = state.scanningItemMap.get(action.payload.isbn);
      if (!scanningItemMapValue) return;
      if (scanningItemMapValue.filterSets.length <= action.payload.index) return;
      const filterSet = scanningItemMapValue.filterSets[action.payload.index];
      const anywhere = action.payload.anywhere;
      const addFilter = { anywhere };
      if (!filterSet.filters.length) filterSet.filters.push([]);
      filterSet.filters[0].splice(0, 1, addFilter);
    },
    rejectFetchBookData: (state, action: PayloadAction<Isbn13>) => {
      state.scanningItemMap.delete(action.payload);
    },
    clearScannedItems: state => {
      state.scanningItemMap.clear();
    },
    updateSelectedScanIsbn: (state, action: PayloadAction<Isbn13 | null>) => {
      state.selectedIsbn = action.payload;
    },
  },
});

export const {
  addScannedIsbn,
  setFetchedBookData,
  rejectFetchBookData,
  clearScannedItems,
  updateSelectedScanIsbn,
  updateFetchedFetchOption,
  updateFetchedFilterAnywhere,
} = scannerSlice.actions;

const selectSelectedIsbn = (state: RootState) => state.scanner.selectedIsbn;
export const selectScanningItemMap = (state: RootState) => state.scanner.scanningItemMap;
export const selectScannedBookDetails = createSelector(
  [selectScanningItemMap],
  (scanningItemMap): Map<Isbn13, PickRequired<ScanFinishedItemMapValue, 'bookDetail'>> => {
    const result = new Map<Isbn13, PickRequired<ScanFinishedItemMapValue, 'bookDetail'>>();
    Array.from(scanningItemMap.entries()).forEach(([isbn, scanningItemMapValue]) => {
      if (scanningItemMapValue?.bookDetail?.book)
        result.set(isbn, scanningItemMapValue as PickRequired<ScanFinishedItemMapValue, 'bookDetail'>);
    });
    return result;
  }
);
export const selectSelectedScannedItemMapValue = createSelector(
  [selectScannedBookDetails, selectSelectedIsbn],
  (fetchedBookDetails, selectedIsbn): PickRequired<ScanFinishedItemMapValue, 'bookDetail'> | null => {
    if (!selectedIsbn) return null;
    return fetchedBookDetails.get(selectedIsbn) ?? null;
  }
);

export default scannerSlice.reducer;
