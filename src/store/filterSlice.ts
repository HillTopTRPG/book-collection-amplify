import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {FilterData} from '@/components/FilterUI';

import {RootState} from './index.ts';

interface FilterState {
  filterSetId: string | null;
  filterSet: FilterData[];
}

const initialState: FilterState = {
  filterSetId: null,
  filterSet: [],
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilterSet: (state, action: PayloadAction<{ id: string | null; filterSet: FilterData[]; }>) => {
      state.filterSetId = action.payload.id;
      state.filterSet = action.payload.filterSet;
    },
    resetFilterSet: (state) => {
      state.filterSetId = null;
      state.filterSet = [];
    },
  },
});

export const {
  setFilterSet,
  resetFilterSet,
} = filterSlice.actions;

export const selectFilterSetId = (state: RootState) => state.filter.filterSetId;
export const selectFilterSet = (state: RootState) => state.filter.filterSet;

export default filterSlice.reducer;