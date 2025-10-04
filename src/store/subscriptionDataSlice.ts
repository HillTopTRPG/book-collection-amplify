import type { BookData, BookStatus, Collection, CollectionBook, FilterSet } from '@/types/book.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { filterMatch } from '@/utils/primitive.ts';
import { createSimpleReducers, simpleSelector } from '@/utils/store.ts';

type State = {
  collections: Collection[];
  tempCollections: Collection[];
  filterSets: FilterSet[];
  tempFilterSets: FilterSet[];
  updatingCollectionApiIdList: string[];
};

const initialState: State = {
  collections: [],
  tempCollections: [],
  filterSets: [],
  tempFilterSets: [],
  updatingCollectionApiIdList: [],
} as const;

export const subscriptionDataSlice = createSlice({
  name: 'subscriptionData',
  initialState,
  reducers: {
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      const createList = action.payload.filter(({ id }) => !state.collections.some(c => c.id === id));
      const updateList = action.payload.filter(({ id, updatedAt }) =>
        state.collections.some(c => c.id === id && c.updatedAt !== updatedAt)
      );
      const deleteList = state.collections.filter(({ id }) => !action.payload.some(a => a.id === id));
      const apiIdList = [createList, updateList, deleteList].flatMap(list => list.map(({ apiId }) => apiId));
      state.updatingCollectionApiIdList
        .flatMap((apiId, idx) => (apiIdList.includes(apiId) ? [idx] : []))
        .reverse()
        .forEach(idx => state.updatingCollectionApiIdList.splice(idx, 1));
      state.collections = action.payload;
    },
    addTempCollections: (state, action: PayloadAction<Collection[]>) => {
      state.tempCollections.push(...action.payload);
    },
    setFilterSets: createSimpleReducers('filterSets'),
    addUpdatingCollectionApiIdList: (state, action: PayloadAction<string[]>) => {
      state.updatingCollectionApiIdList.push(...action.payload);
    },
    clearTempData: state => {
      state.tempCollections = [];
      state.tempFilterSets = [];
    },
    resetSubscriptionData: () => initialState,
  },
});

export const {
  setCollections,
  addTempCollections,
  setFilterSets,
  addUpdatingCollectionApiIdList,
  clearTempData,
  resetSubscriptionData,
} = subscriptionDataSlice.actions;

export const selectCollections = simpleSelector('subscriptionData', 'collections');
export const selectTempCollections = simpleSelector('subscriptionData', 'tempCollections');
export const selectFilterSets = simpleSelector('subscriptionData', 'filterSets');
export const selectTempFilterSets = simpleSelector('subscriptionData', 'tempFilterSets');
export const selectUpdatingCollectionApiIdList = simpleSelector('subscriptionData', 'updatingCollectionApiIdList');
export const selectAllFilterSets = createSelector(
  [selectFilterSets, selectTempFilterSets],
  (filterSets, tempFilterSets): FilterSet[] => [...filterSets, ...tempFilterSets]
);

export const selectFilterSet = createSelector(
  [selectFilterSets, (_state, filterSetId: string | null | undefined) => filterSetId],
  (filterSets, id): FilterSet | null => filterSets.find(filterMatch({ id })) ?? null
);

export const DEFAULT_COLLECTION: Collection = {
  id: '',
  apiId: '',
  status: 'Unregistered',
  updatedAt: '',
  createdAt: '',
  owner: '',
} as const;

export const selectCollectionByApiId = createSelector(
  [selectCollections, (_state, apiId: string | null | undefined) => apiId],
  (collections, apiId): Collection =>
    apiId ? (collections.find(filterMatch({ apiId })) ?? DEFAULT_COLLECTION) : DEFAULT_COLLECTION
);

export const selectCollectionBooks = createSelector(
  [
    selectCollections,
    (_state, books: BookData[]) => books,
    (_state, _books: BookData[], bookStatusList: BookStatus[]) => bookStatusList,
  ],
  (collections, books, bookStatusList): CollectionBook[] =>
    books.flatMap(book => {
      const { apiId } = book;
      const collection = collections.find(filterMatch({ apiId })) ?? DEFAULT_COLLECTION;
      if (!bookStatusList.includes(collection.status)) return [];

      return [{ ...collection, ...book }];
    })
);

export default subscriptionDataSlice.reducer;
