import type { RootState } from '@/store';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { omit } from 'es-toolkit/compat';
import { arrayEqualityCheck, deleteAllStrings, unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

export const enqueue = <T extends string, U>(
  state: { queue: T[]; results: Record<T, U | 'retrying'> },
  action: PayloadAction<{ list: T[]; type: 'new' | 'retry' | 'priority' }>
) => {
  const addList = action.payload.list.filter(key => {
    const result = key in state.results ? state.results[key] : undefined;
    switch (action.payload.type) {
      case 'new':
        return result === undefined && !state.queue.includes(key);
      case 'retry':
        if (result !== 'retrying') return false;
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

/**
 * RootStateから`queue`プロパティを持つsliceのキーだけを抽出する型
 */
type SlicesWithQueue = {
  [K in keyof RootState]: RootState[K] extends { queue: unknown[] } ? K : never;
}[keyof RootState];

/**
 * 指定されたsliceの`queue`配列の要素型を抽出する型
 */
type QueueItemType<S extends SlicesWithQueue> = RootState[S] extends { queue: (infer T)[] } ? T : never;

/**
 * キュー処理対象を選択するセレクターを作成するヘルパー関数
 *
 * @param sliceName - Reduxスライス名（queueプロパティを持つsliceのみ）
 * @param targetCount - 処理対象の件数（queue.slice(0, targetCount)）
 * @returns unique()とslice()を適用し、arrayEqualityCheckでメモ化されたセレクター
 *
 * @example
 * export const selectNdlSearchTargets = createQueueTargetSelector('fetchNdlSearch', 1);
 */
export const createQueueTargetSelector = <S extends SlicesWithQueue>(sliceName: S, targetCount: number) => {
  type T = QueueItemType<S>;

  // インデックスアクセス state[sliceName] はユニオン型として推論されるため、型アサーションが必要
  const selectQueue = (state: RootState): T[] => state[sliceName].queue as T[];

  return createSelector([selectQueue], unUniqueQueue => unique(unUniqueQueue).slice(0, targetCount), {
    memoizeOptions: {
      resultEqualityCheck: arrayEqualityCheck,
    },
  });
};
