import { createSlice } from '@reduxjs/toolkit';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/FilterSets/NdlOptionsForm.tsx';
import type { Isbn13, BookData } from '@/types/book.ts';
import { createSimpleReducers } from '@/utils/store.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import type { RootState } from './index.ts';

export type Collection = Omit<Schema['Collection']['type'], 'isbn' | 'meta'> & {
  isbn: Isbn13;
  meta: {
    overwrite?: Partial<BookData>;
    isWant?: boolean;
    isHave?: boolean;
  };
};

export type Sign = '==' | '*=' | '!=' | '!*';
export type FilterBean = { keyword: string; sign: Sign };
export type FilterAndGroup = { list: FilterBean[]; grouping: 'date' | null };

export type FilterSet = Omit<Schema['FilterSet']['type'], 'fetch' | 'filters' | 'primary'> & {
  fetch: NdlFullOptions;
  filters: FilterAndGroup[];
  primary: Isbn13;
};

type State = {
  collections: Array<Collection>;
  filterSets: Array<FilterSet>;
  createFilterSet: Schema['FilterSet']['type'] | null;
};

const initialState: State = {
  collections: [],
  filterSets: [],
  createFilterSet: null,
} as const;

export const subscriptionDataSlice = createSlice({
  name: 'subscriptionData',
  initialState,
  reducers: {
    setCollections: createSimpleReducers('collections'),
    setFilterSets: createSimpleReducers('filterSets'),
    setCreateFilterSet: createSimpleReducers('createFilterSet'),
  },
});

export const { setCollections, setFilterSets, setCreateFilterSet } = subscriptionDataSlice.actions;

export const selectCollections = (state: RootState) => state.subscriptionData.collections;
export const selectFilterSets = (state: RootState) => state.subscriptionData.filterSets;
/** フィルターセットをDBに登録した直後にそのIDを取得するための特別なもの */
export const selectCreateFilterSet = (state: RootState) => state.subscriptionData.createFilterSet;

export default subscriptionDataSlice.reducer;
