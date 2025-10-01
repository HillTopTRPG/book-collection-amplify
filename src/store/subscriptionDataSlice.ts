import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { Isbn13 } from '@/types/book.ts';
import type { Values } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Schema } from '$/amplify/data/resource.ts';
import { createSlice } from '@reduxjs/toolkit';
import { filterMatch } from '@/utils/primitive.ts';
import { createSimpleReducers, simpleSelector } from '@/utils/store.ts';
import { getKeys } from '@/utils/type.ts';

export const BookStatusEnum = {
  // 未登録
  Unregistered: 'Unregistered',
  // 買わない
  NotBuy: 'NotBuy',
  // 保留
  Hold: 'Hold',
  // 購入予定
  Planned: 'Planned',
  // 所持済
  Owned: 'Owned',
} as const;

export const isBookStatus = (str: string): str is BookStatus =>
  getKeys(BookStatusEnum).some(key => BookStatusEnum[key] === str);

export type BookStatus = Values<typeof BookStatusEnum>;

export const BookStatusLabelMap: Record<BookStatus, { label: string; className: string }> = {
  [BookStatusEnum.Unregistered]: { label: '未登録', className: 'bg-yellow-700 text-white' },
  [BookStatusEnum.NotBuy]: { label: '買わない', className: 'bg-gray-700 text-white' },
  [BookStatusEnum.Hold]: { label: '保留', className: 'bg-green-700 text-white' },
  [BookStatusEnum.Planned]: { label: '購入予定', className: 'bg-fuchsia-900 text-white' },
  [BookStatusEnum.Owned]: { label: '所持済', className: 'bg-blue-600 text-white' },
} as const;

export type Collection = Omit<Schema['Collection']['type'], 'isbn' | 'status'> & {
  isbn: Isbn13;
  status: BookStatus;
};

export type Sign = '==' | '*=' | '!=' | '!*';
export type FilterBean = { keyword: string; sign: Sign };
export type FilterAndGroup = { list: FilterBean[]; grouping: 'date' | null };

export type FilterSet = Omit<Schema['FilterSet']['type'], 'fetch' | 'filters'> & {
  fetch: NdlFullOptions;
  filters: FilterAndGroup[];
};

type State = {
  collections: Collection[];
  tempCollections: Collection[];
  filterSets: FilterSet[];
  tempFilterSets: FilterSet[];
  updatingCollectionIsbnList: Isbn13[];
};

const initialState: State = {
  collections: [],
  tempCollections: [],
  filterSets: [],
  tempFilterSets: [],
  updatingCollectionIsbnList: [],
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
      const isbnList = [createList, updateList, deleteList].flatMap(list => list.map(({ isbn }) => isbn));
      console.log(isbnList);
      state.updatingCollectionIsbnList
        .flatMap((isbn, idx) => (isbnList.includes(isbn) ? [idx] : []))
        .reverse()
        .forEach(idx => state.updatingCollectionIsbnList.splice(idx, 1));
      state.collections = action.payload;
    },
    addTempCollections: (state, action: PayloadAction<Collection[]>) => {
      state.tempCollections.push(...action.payload);
    },
    setFilterSets: createSimpleReducers('filterSets'),
    addTempFilterSets: (state, action: PayloadAction<FilterSet[]>) => {
      state.tempFilterSets.push(...action.payload);
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
    addUpdatingCollectionIsbnList: (state, action: PayloadAction<Isbn13[]>) => {
      state.updatingCollectionIsbnList.push(...action.payload);
      console.log(JSON.stringify(state.updatingCollectionIsbnList));
    },
  },
});

export const {
  setCollections,
  addTempCollections,
  setFilterSets,
  addTempFilterSets,
  updateTempFilterSetOption,
  updateFetchedFilterAnywhere,
  addUpdatingCollectionIsbnList,
} = subscriptionDataSlice.actions;

export const selectCollections = simpleSelector('subscriptionData', 'collections');
export const selectTempCollections = simpleSelector('subscriptionData', 'tempCollections');
export const selectFilterSets = simpleSelector('subscriptionData', 'filterSets');
export const selectTempFilterSets = simpleSelector('subscriptionData', 'tempFilterSets');
/** フィルターセットをDBに登録した直後にそのIDを取得するための特別なもの */
export const selectUpdatingCollectionIsbnList = simpleSelector('subscriptionData', 'updatingCollectionIsbnList');

export default subscriptionDataSlice.reducer;
