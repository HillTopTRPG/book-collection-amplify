import { createSlice } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { Isbn13 } from '@/store/scannerSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export type Collection = Omit<Schema['Collection']['type'], 'isbn' | 'meta'> & {
  isbn: Isbn13;
  meta: {
    overwrite?: Partial<BookData>;
    isWant?: boolean;
    isHave?: boolean;
  };
};

export type FilterSet = Omit<Schema['FilterSet']['type'], 'fetch' | 'filters'> & {
  fetch: NdlFullOptions;
  filters: { anywhere: string }[][];
};

type State = {
  collections: Array<Collection>;
  filterSets: Array<FilterSet>;
  createFilterSet: Parameters<typeof userPoolClient.models.FilterSet.create>[0] | null;
};

const initialState: State = {
  collections: [],
  filterSets: [],
  createFilterSet: null,
};

export const subscriptionDataSlice = createSlice({
  name: 'subscriptionData',
  initialState,
  reducers: {
    setCollections: (state, action: PayloadAction<State['collections']>) => {
      state.collections = action.payload;
    },
    setFilterSets: (state, action: PayloadAction<State['filterSets']>) => {
      state.filterSets = action.payload;
    },
    setCreateFilterSet: (state, action: PayloadAction<State['createFilterSet']>) => {
      state.createFilterSet = action.payload;
    },
  },
});

export const { setCollections, setFilterSets, setCreateFilterSet } = subscriptionDataSlice.actions;

export const selectCollections = (state: RootState) => state.subscriptionData.collections;
export const selectFilterSets = (state: RootState) => state.subscriptionData.filterSets;
/** フィルターセットをDBに登録した直後にそのIDを取得するための特別なもの */
export const selectCreateFilterSet = (state: RootState) => state.subscriptionData.createFilterSet;

export default subscriptionDataSlice.reducer;
