import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { Isbn13 } from '@/types/book.ts';
import type { Values } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Schema } from '$/amplify/data/resource.ts';
import { createSlice } from '@reduxjs/toolkit';
import { filterMatch } from '@/utils/primitive.ts';
import { createSimpleReducers, simpleSelector } from '@/utils/store.ts';

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

export type BookStatus = Values<typeof BookStatusEnum>;

export const BookStatusLabelMap: Record<BookStatus, { label: string; className: string }> = {
  [BookStatusEnum.Unregistered]: { label: '未登録', className: 'bg-yellow-700 text-white' },
  [BookStatusEnum.NotBuy]: { label: '買わない', className: 'bg-gray-700 text-white' },
  [BookStatusEnum.Hold]: { label: '保留', className: 'bg-green-700 text-white' },
  [BookStatusEnum.Planned]: { label: '購入予定', className: 'bg-fuchsia-900 text-white' },
  [BookStatusEnum.Owned]: { label: '所持済', className: 'bg-blue-600 text-white' },
} as const;

export type Collection = Omit<Schema['Collection']['type'], 'isbn' | 'meta'> & {
  isbn: Isbn13;
  meta: {
    status: BookStatus;
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
  collections: Collection[];
  tempCollections: Collection[];
  filterSets: FilterSet[];
  tempFilterSets: FilterSet[];
  createFilterSet: Schema['FilterSet']['type'] | null;
};

const initialState: State = {
  collections: [],
  tempCollections: [],
  filterSets: [],
  tempFilterSets: [],
  createFilterSet: null,
} as const;

export const subscriptionDataSlice = createSlice({
  name: 'subscriptionData',
  initialState,
  reducers: {
    setCollections: createSimpleReducers('collections'),
    addTempCollections: (state, action: PayloadAction<Collection[]>) => {
      state.tempCollections.push(...action.payload);
    },
    setTempCollectionMeta: (state, action: PayloadAction<{ id: string; meta: Collection['meta'] }>) => {
      const id = action.payload.id;
      const collection = state.tempCollections.find(filterMatch({ id }));
      console.log(id, JSON.stringify(action.payload.meta, null, 2), !collection);
      if (!collection) return;
      collection.meta = action.payload.meta;
    },
    setFilterSets: createSimpleReducers('filterSets'),
    addTempFilterSets: (state, action: PayloadAction<FilterSet[]>) => {
      state.tempFilterSets.push(...action.payload);
    },
    setCreateFilterSet: createSimpleReducers('createFilterSet'),
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
  },
});

export const {
  setCollections,
  addTempCollections,
  setTempCollectionMeta,
  setFilterSets,
  addTempFilterSets,
  setCreateFilterSet,
  updateTempFilterSetOption,
  updateFetchedFilterAnywhere,
} = subscriptionDataSlice.actions;

export const selectCollections = simpleSelector('subscriptionData', 'collections');
export const selectTempCollections = simpleSelector('subscriptionData', 'tempCollections');
export const selectFilterSets = simpleSelector('subscriptionData', 'filterSets');
export const selectTempFilterSets = simpleSelector('subscriptionData', 'tempFilterSets');
/** フィルターセットをDBに登録した直後にそのIDを取得するための特別なもの */
export const selectCreateFilterSet = simpleSelector('subscriptionData', 'createFilterSet');

export default subscriptionDataSlice.reducer;
