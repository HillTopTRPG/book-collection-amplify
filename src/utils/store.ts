import { omit } from 'es-toolkit/compat';
import type { RootState } from '@/store';
import { deleteAllStrings } from '@/utils/data.ts';
import { getKeys } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export const enqueue = <T extends string, U>(
  state: { queue: T[]; results: Record<T, U | 'retrying'> },
  action: PayloadAction<{ list: T[]; type: 'new' | 'retry' | 'priority' }>
) => {
  const addList = action.payload.list.filter(key => {
    const result = state.results[key];
    switch (action.payload.type) {
      case 'new':
        return result === undefined && !state.queue.includes(key);
      case 'retry':
        if (result === 'retrying') return false;
        return state.queue.at(0) !== key;
      case 'priority':
      default:
        return result === undefined && state.queue.at(0) !== key;
    }
  });

  if (action.payload.type === 'new') {
    state.queue.push(...addList);
  } else {
    state.queue.splice(1, 0, ...addList);
  }

  return addList;
};

export const dequeue = <T extends string, U>(
  state: { queue: T[]; results: Record<T, U> },
  action: PayloadAction<Record<T, U>>
) => {
  const results = action.payload;

  // 結果を格納する
  state.results = {
    ...state.results,
    ...omit(
      results,
      getKeys(results).filter(isbn => !state.queue.includes(isbn))
    ),
  };
  // キューから一致するISBNを全て削除する
  deleteAllStrings(state.queue, getKeys(state.results));
};

export const createSimpleReducers =
  <State, Property extends keyof State>(property: Property) =>
  (state: State, action: PayloadAction<State[Property]>) => {
    state[property] = action.payload;
  };

export const simpleSelector =
  <State extends keyof RootState, Property extends keyof RootState[State]>(state: State, property: Property) =>
  (rootState: RootState) =>
    rootState[state][property];
