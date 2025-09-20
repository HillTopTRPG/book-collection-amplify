import { createSelector, createSlice } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import type { NdlOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import { selectFilterQueueResults } from '@/store/fetchApiQueueSlice.ts';
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
  fetch: NdlOptions & {
    creator: string;
    publisher: string;
  };
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
/** DBのフィルター : フィルター情報に基づいてfetchした書籍データ一覧 */
export const selectDbFilterSetsBooks = createSelector(
  [selectFilterSets, selectFilterQueueResults],
  (filterSets, filterQueueResults): Map<string, BookData[]> | null => {
    const result = new Map<string, BookData[]>();
    for (const filterSet of filterSets) {
      const options = JSON.stringify(filterSet.fetch);
      const results = filterQueueResults[options] ?? null;
      if (!results) return null;
      result.set(options, results);
    }
    return result;
  }
);
export const selectCreateFilterSet = (state: RootState) => state.subscriptionData.createFilterSet;

export default subscriptionDataSlice.reducer;
