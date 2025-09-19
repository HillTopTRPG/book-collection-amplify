import { createSlice } from '@reduxjs/toolkit';

import type { FilterData } from '@/types/filter.ts';

import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type State = {
  filterSetId: string | null;
  filters: FilterData[];
};

const initialState: State = {
  filterSetId: null,
  filters: [],
};

export const editFilterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilterSet: (state, action: PayloadAction<{ id: string | null; filters: FilterData[] }>) => {
      state.filterSetId = action.payload.id;
      state.filters = action.payload.filters;
    },
    resetFilterSet: state => {
      state.filterSetId = null;
      state.filters = [];
    },
  },
});

export const { setFilterSet, resetFilterSet } = editFilterSlice.actions;

export const selectEditFilterSetId = (state: RootState) => state.editFilter.filterSetId;
export const selectEditFilters = (state: RootState) => state.editFilter.filters;

export default editFilterSlice.reducer;
