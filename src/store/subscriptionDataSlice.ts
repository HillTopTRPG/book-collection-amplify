import { createSelector, createSlice } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';

import { filterArrayByKey } from '@/utils/primitive.ts';

import type { Schema } from '$/amplify/data/resource.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

interface State {
  collections: Array<Schema['Collection']['type']>;
  books: Array<Schema['Book']['type']>;
  filterSets: Array<Schema['FilterSet']['type']>;
  createFilterSet: Parameters<typeof userPoolClient.models.FilterSet.create>[0] | null;
}

const initialState: State = {
  collections: [],
  books: [],
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
    setBooks: (state, action: PayloadAction<State['books']>) => {
      state.books = action.payload;
    },
    setFilterSets: (state, action: PayloadAction<State['filterSets']>) => {
      state.filterSets = action.payload;
    },
    setCreateFilterSet: (state, action: PayloadAction<State['createFilterSet']>) => {
      state.createFilterSet = action.payload;
    },
  },
});

export const {
  setCollections, setBooks, setFilterSets, setCreateFilterSet
} = subscriptionDataSlice.actions;

export const selectCollections = (state: RootState) => state.subscriptionData.collections;
export const selectBooks = (state: RootState) => state.subscriptionData.books;
export const selectMyBooks = createSelector([selectCollections, selectBooks], (collections, books) => filterArrayByKey(books, collections, 'isbn'));
export const selectFilterSets = (state: RootState) => state.subscriptionData.filterSets;
export const selectCreateFilterSet = (state: RootState) => state.subscriptionData.createFilterSet;

export default subscriptionDataSlice.reducer;