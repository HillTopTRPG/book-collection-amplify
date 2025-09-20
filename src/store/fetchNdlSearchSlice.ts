import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData } from '@/types/book.ts';
import type { RootState } from './index.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type FilterQueue = string[];
type FilterQueueResults = Record<string, BookData[]>;

type State = {
  // NDL検索処理 / キュー
  filterQueue: FilterQueue;
  // NDL検索処理 / 処理結果
  filterQueueResults: FilterQueueResults;
};

const initialState: State = {
  filterQueue: [],
  filterQueueResults: {},
};

const checkFilterQueueExists = (key: string, state: State) => {
  const queueItem = state.filterQueue.includes(key);
  const resultItem = state.filterQueueResults[key];

  const queue = Boolean(queueItem);
  const result = resultItem !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};

export const fetchNdlSearchSlice = createSlice({
  name: 'fetchNdlSearch',
  initialState,
  reducers: {
    enqueueNdlSearch: (state, action: PayloadAction<{ options: string[]; type: 'new' | 'priority' }>) => {
      const addList = action.payload.options.filter(option => {
        if (action.payload.type === 'new') {
          return !checkFilterQueueExists(option, state);
        } else {
          return state.filterQueueResults[option] === undefined && state.filterQueue.at(0) !== option;
        }
      });

      if (action.payload.type === 'new') {
        state.filterQueue.push(...addList);
      } else {
        state.filterQueue.splice(1, 0, ...addList);
      }
    },
    dequeueNdlSearch: (state, action: PayloadAction<{ option: string; books: BookData[] }[]>) => {
      action.payload.forEach(({ option, books }) => {
        const existsCheck = checkFilterQueueExists(option, state);
        if (!existsCheck?.queue) return;

        // キューから一致するオプションを全て削除する
        state.filterQueue
          .flatMap((queuedOption, index) => (queuedOption === option ? [index] : []))
          .reverse()
          .forEach(deleteIndex => state.filterQueue.splice(deleteIndex, 1));
        state.filterQueueResults[option] = books;
      });
    },
  },
});

export const { enqueueNdlSearch, dequeueNdlSearch } = fetchNdlSearchSlice.actions;

const _selectFilterQueue = (state: RootState) => state.fetchNdlSearch.filterQueue;
/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchQueueTargets = createSelector([_selectFilterQueue], filterQueue => filterQueue.slice(0, 2));
/** NDL検索条件：書籍一覧 のRecord */
export const selectNdlSearchQueueResults = (state: RootState) => state.fetchNdlSearch.filterQueueResults;

export default fetchNdlSearchSlice.reducer;
