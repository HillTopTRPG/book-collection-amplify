import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from './index.ts';
import type { BookData } from '../types/book';
import type { PayloadAction } from '@reduxjs/toolkit';

export type FetchResultMap = Record<string, BookData[]>;

type State = {
  fetchResultMap: FetchResultMap;
};

const initialState: State = {
  fetchResultMap: {},
};

export const fetchResultSlice = createSlice({
  name: 'fetchResult',
  initialState,
  reducers: {
    updateFetchResult: (state, action: PayloadAction<FetchResultMap>) => {
      state.fetchResultMap = { ...state.fetchResultMap, ...action.payload };
    },
    deleteFetchResult: (state, action: PayloadAction<string>) => {
      if (!state.fetchResultMap[action.payload]) return;
      delete state.fetchResultMap[action.payload];
    },
  },
});

export const { updateFetchResult, deleteFetchResult } = fetchResultSlice.actions;

export const selectFetchResultMap = (state: RootState) => state.fetchResult.fetchResultMap;

export default fetchResultSlice.reducer;
