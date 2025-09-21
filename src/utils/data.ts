import { omit } from 'es-toolkit/compat';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { RootState } from '@/store';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlOptions } from '@/utils/fetch.ts';
import { filterMatch } from '@/utils/primitive.ts';
import type { PickRequired } from '@/utils/type.ts';
import { getKeys } from '@/utils/type.ts';
import type { PayloadAction } from '@reduxjs/toolkit';

export const getScannedItemMapValueByBookData = (collections: Collection[], book: BookData): ScannedItemMapValue => {
  const isbn = book.isbn;
  const result: PickRequired<ScannedItemMapValue, 'bookDetail'> = {
    isbn,
    status: 'loading',
    collectionId: null,
    bookDetail: { book, isHave: false, isWant: false },
    filterSets: [],
  };
  const collection = collections.find(filterMatch({ isbn }));
  if (collection) {
    result.bookDetail.book = { ...book, ...collection.meta.overwrite };
    result.bookDetail.isHave = collection.meta.isHave ?? false;
    result.bookDetail.isWant = collection.meta.isWant ?? false;
  }
  return result;
};

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  const requestOptions: NdlOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  return JSON.stringify(requestOptions);
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

export const deleteAllString = <T extends string>(list: T[], value: T) => {
  list
    .flatMap((v, index) => (v === value ? [index] : []))
    .reverse()
    .forEach(deleteIndex => list.splice(deleteIndex, 1));
};

export const deleteAllStrings = <T extends string>(list: T[], values: T[]) => {
  list
    .flatMap((v, index) => (values.includes(v) ? [index] : []))
    .reverse()
    .forEach(deleteIndex => list.splice(deleteIndex, 1));
};

export const enqueue = <T extends string, U>(
  state: { queue: T[]; results: Record<T, U> },
  action: PayloadAction<{ list: T[]; type: 'new' | 'retry' | 'priority' }>,
  isRetryResult?: (result: U) => boolean
) => {
  const addList = action.payload.list.filter(key => {
    const result = state.results[key];
    switch (action.payload.type) {
      case 'new':
        return result === undefined && !state.queue.includes(key);
      case 'retry':
        return isRetryResult?.(result) && state.queue.at(0) !== key;
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

export const entries = <T extends string, U>(map: Map<T, U>): Record<T, U> => Object.fromEntries(map) as Record<T, U>;
