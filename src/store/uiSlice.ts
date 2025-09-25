import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type State = {
  scrollValueMap: Record<'bookDetail', number>;
};

const initialState: State = {
  scrollValueMap: {} as State['scrollValueMap'],
} as const;

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setScrollValue: (state, action: PayloadAction<{ key: 'bookDetail'; value: number }>) => {
      state.scrollValueMap[action.payload.key] = action.payload.value;
    },
  },
});

export const { setScrollValue } = uiSlice.actions;

const _selectUiScrollValueMap = (state: RootState) => state.ui.scrollValueMap;

export const selectBookDetailScrollValue = createSelector([_selectUiScrollValueMap], valueMap => valueMap.bookDetail);

export default uiSlice.reducer;
