import { createSelector, createSlice } from '@reduxjs/toolkit';
import { selectFetchResultMap } from '@/store/fetchResultSlice.ts';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import { getScannedItemMapValueByBookData } from '@/utils/data.ts';
import { filterMatch } from '@/utils/primitive.ts';
import { selectCollections, selectFilterSets } from './subscriptionDataSlice';
import type { RootState } from './index';
import type { Collection } from './subscriptionDataSlice';
import type { PayloadAction } from '@reduxjs/toolkit';

type State = {
  selectedFilterSetId: string | null;
};

const initialState: State = {
  selectedFilterSetId: null,
};

export const filterDetailDrawerSlice = createSlice({
  name: 'filterDetailDrawer',
  initialState,
  reducers: {
    openDrawer: (state, action: PayloadAction<string>) => {
      state.selectedFilterSetId = action.payload;
    },
    closeDrawer: state => {
      state.selectedFilterSetId = null;
    },
  },
});

export const { openDrawer, closeDrawer } = filterDetailDrawerSlice.actions;

export const selectSelectedFilterSetId = (state: RootState) => state.filterDetailDrawer.selectedFilterSetId;
export const selectSelectedFilterSet = createSelector(
  [selectFilterSets, selectSelectedFilterSetId],
  (filterSets, id) => {
    if (!id) return null;
    return filterSets.find(filterMatch({ id })) ?? null;
  }
);
export type BookDetail = {
  book: BookData | null;
  isHave: boolean;
} & Required<Omit<Collection['meta'], 'overwrite'>>;
export const selectScannedItemMapValueBySelectedFilterSet = createSelector(
  [selectSelectedFilterSet, selectFetchResultMap, selectCollections],
  (selectedFilterSet, fetchResultMap, collections): ScannedItemMapValue[] => {
    const books = fetchResultMap[selectedFilterSet?.id ?? ''] ?? [];

    return books.map(book => getScannedItemMapValueByBookData(collections, book));
  }
);

export default filterDetailDrawerSlice.reducer;
