import type { RootState } from './index';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { filterMatch } from '@/utils/primitive.ts';
import { selectFilterSets } from './subscriptionDataSlice';

type State = {
  selectedFilterSetId: string | null;
};

const initialState: State = {
  selectedFilterSetId: null,
} as const;

export const filterDetailDrawerSlice = createSlice({
  name: 'filterDetailDrawer',
  initialState,
  reducers: {
    openDrawer: (state, action: PayloadAction<string>) => {
      state.selectedFilterSetId = action.payload;
    },
    closeDrawer: state => {
      state.selectedFilterSetId = null;
    },
  },
});

export const { openDrawer, closeDrawer } = filterDetailDrawerSlice.actions;

export const selectSelectedFilterSetId = (state: RootState) => state.filterDetailDrawer.selectedFilterSetId;
export const selectSelectedFilterSet = createSelector(
  [selectFilterSets, selectSelectedFilterSetId],
  (filterSets, id) => {
    if (!id) return null;
    return filterSets.find(filterMatch({ id })) ?? null;
  }
);

export default filterDetailDrawerSlice.reducer;
