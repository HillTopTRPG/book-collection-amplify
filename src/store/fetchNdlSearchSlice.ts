import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { BookData } from '@/types/book.ts';
import { deleteAllString, simpleSelector } from '@/utils/data.ts';
import { unique } from '@/utils/primitive.ts';
import { checkQueueExists } from '@/utils/validate.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

type QueueType = string;
type QueueResult = BookData[];

type State = {
  // NDL検索処理 / キュー
  queue: QueueType[];
  // NDL検索処理 / 処理結果
  results: Record<QueueType, QueueResult>;
};

const initialState: State = {
  queue: [],
  results: {},
};

export const fetchNdlSearchSlice = createSlice({
  name: 'fetchNdlSearch',
  initialState,
  reducers: {
    enqueueNdlSearch: (state, action: PayloadAction<{ options: QueueType[]; type: 'new' | 'priority' }>) => {
      const addList = action.payload.options.filter(option => {
        if (action.payload.type === 'new') {
          return !checkQueueExists(option, state.queue, state.results);
        } else {
          return state.results[option] === undefined && state.queue.at(0) !== option;
        }
      });

      if (action.payload.type === 'new') {
        state.queue.push(...addList);
      } else {
        state.queue.splice(1, 0, ...addList);
      }
    },
    dequeueNdlSearch: (state, action: PayloadAction<{ option: QueueType; books: QueueResult }[]>) => {
      action.payload.forEach(({ option, books }) => {
        const existsCheck = checkQueueExists(option, state.queue, state.results);
        if (!existsCheck?.queue) return;

        // キューから一致するオプションを全て削除する
        deleteAllString(state.queue, option);
        state.results[option] = books;
      });
    },
  },
});

export const { enqueueNdlSearch, dequeueNdlSearch } = fetchNdlSearchSlice.actions;

const _selectQueueUnUnique = simpleSelector('fetchNdlSearch', 'queue');
const _selectQueue = createSelector([_selectQueueUnUnique], unUniqueQueue => unique(unUniqueQueue));
/** NDL検索キューの中で処理対象のもの */
export const selectNdlSearchQueueTargets = createSelector([_selectQueue], queue => queue.slice(0, 2));
/** NDL検索条件：書籍一覧 のRecord */
export const selectNdlSearchQueueResults = simpleSelector('fetchNdlSearch', 'results');

export default fetchNdlSearchSlice.reducer;
