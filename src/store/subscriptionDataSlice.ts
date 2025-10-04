import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { BookData, BookStatus, Collection, CollectionBook, FilterAndGroup, FilterSet } from '@/types/book.ts';
import type { BookWithVolume } from '@/utils/groupByVolume.ts';
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
    addTempFilterSets: (state, action: PayloadAction<FilterSet[]>) => {
      state.tempFilterSets.push(...action.payload);
    },
    updateTempFilterSet: (state, action: PayloadAction<FilterSet>) => {
      const id = action.payload.id;
      const idx = state.tempFilterSets.findIndex(filterMatch({ id }));
      if (idx < 0) return;
      state.tempFilterSets.splice(idx, 1, action.payload);
    },
    updateTempFilterSetOption: (state, action: PayloadAction<{ id: string; fetch: NdlFullOptions }>) => {
      const id = action.payload.id;
      const filterSet = state.tempFilterSets.find(filterMatch({ id }));
      if (!filterSet) return;
      filterSet.fetch = action.payload.fetch;
    },
    updateFetchedFilterAnywhere: (state, action: PayloadAction<{ id: string; filters: FilterAndGroup[] }>) => {
      const id = action.payload.id;
      const filterSet = state.tempFilterSets.find(filterMatch({ id }));
      if (!filterSet) return;
      filterSet.filters = action.payload.filters;
    },
    addUpdatingCollectionApiIdList: (state, action: PayloadAction<string[]>) => {
      state.updatingCollectionApiIdList.push(...action.payload);
    },
    clearTempData: state => {
      state.tempCollections = [];
      state.tempFilterSets = [];
    },
  },
});

export const {
  setCollections,
  addTempCollections,
  setFilterSets,
  addTempFilterSets,
  updateTempFilterSet,
  updateTempFilterSetOption,
  updateFetchedFilterAnywhere,
  addUpdatingCollectionApiIdList,
  clearTempData,
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

export const selectBookWithVolumeCollections = createSelector(
  [
    selectCollections,
    (_state, books: BookWithVolume[]) => books,
    (_state, _books: BookWithVolume[], bookStatusList: BookStatus[]) => bookStatusList,
  ],
  (collections, books, bookStatusList): { collectionBook: CollectionBook; volume: number; collection: Collection }[] =>
    books.flatMap(({ collectionBook, volume }) => {
      const { apiId } = collectionBook;
      const dbCollection = collections.find(filterMatch({ apiId }));
      if (!bookStatusList.includes(dbCollection?.status ?? 'Unregistered')) return [];

      return [{ collectionBook, volume, collection: dbCollection ?? DEFAULT_COLLECTION }];
    })
);

export default subscriptionDataSlice.reducer;
