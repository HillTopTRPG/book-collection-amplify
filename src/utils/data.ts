import { isNil, omit } from 'es-toolkit/compat';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/FilterSets/NdlOptionsForm.tsx';
import type { RootState } from '@/store';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection, FilterBean, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/utils/fetch.ts';
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
  const requestOptions: NdlFetchOptions = {
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

const isMatch = (filter: FilterBean, list: string[]) => {
  const keyword = filter.keyword;
  switch (filter.sign) {
    case '==':
      return list.includes(keyword);
    case '*=':
      return list.some(v => v.includes(keyword));
    case '!=':
      return list.every(v => v !== keyword);
    case '!*':
      return list.every(v => !v.includes(keyword));
  }
};

export const entries = <T extends string, U>(map: Map<T, U>): Record<T, U> => Object.fromEntries(map) as Record<T, U>;

export const getFilteredItems = (fetchedBooks: BookData[], filterSet: FilterSet, filterIndex: number): BookData[] => {
  if (!fetchedBooks?.length) return [];

  const filters = filterSet.filters[filterIndex].list.filter(({ keyword }) => keyword);
  if (!filters.length) return !filterIndex ? fetchedBooks : [];

  return fetchedBooks.filter(book =>
    filters.every(filter =>
      isMatch(
        filter,
        getKeys(book).flatMap(property => {
          const value = book[property];
          if (isNil(value)) return [];
          if (typeof value === 'string') return [value];
          return value;
        })
      )
    )
  );
};

const getVolumeNumber = (book: BookData): number | null => {
  const str = (book.volume || book.volumeTitle || book.title || '').replace(/[０-９]/g, s =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );
  const maybeNumStr = [str.match(/^[0-9]+$/)?.at(0), str.match(/^[0-9]+/)?.at(0), str.match(/[0-9]+$/)?.at(0)].find(
    s => s !== undefined
  );
  if (maybeNumStr === undefined) return null;
  return parseInt(maybeNumStr, 10);
};

const matchSet = (book: BookData, matchList: GroupingInfo[], add: number, judge: (book: BookData) => boolean) => {
  const matched = matchList.find(info => judge(info.list[info.list.length - 1]));
  if (!matched) return false;
  matched.next += add;
  matched.list.push(book);
  return true;
};

const isNearDateBook = (b1: BookData, b2: BookData): boolean => {
  const r1 = b1.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  const r2 = b2.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  if (!r1 || !r2) return false;
  const d1 = new Date(parseInt(r1[0]), parseInt(r1[1]) - 1, r1[2] ? parseInt(r1[2]) : 15);
  const d2 = new Date(parseInt(r2[0]), parseInt(r2[1]) - 1, r2[2] ? parseInt(r2[2]) : 15);
  const dayDiff = Math.abs((d2.getTime() - d1.getTime()) / 86400000);

  return dayDiff < 50;
};

type GroupingInfo = { first: number; next: number; list: BookData[] };
export const grouping = (books: BookData[]): GroupingInfo[] => {
  const results: Array<{ first: number; next: number; list: BookData[] }> = [];
  const unSeriesList: BookData[] = [];
  books.forEach(book => {
    const volume = getVolumeNumber(book);
    if (volume === null) return unSeriesList.push(book);

    // 順当に並ぶグループの一覧
    const nextMatchList = [...results].reverse().filter(({ next }) => volume === next);
    if (nextMatchList.length) {
      // 特別な条件に当てはまればそちらのグループを優先する
      if (matchSet(book, nextMatchList, 1, ({ title }) => title === book.title)) return;
      if (matchSet(book, nextMatchList, 1, ({ edition }) => edition === book.edition)) return;
      // グループ一覧の最後に適用するのが通常
      nextMatchList[0].next++;
      nextMatchList[0].list.push(book);
      return;
    }

    // 最後の巻数が同じで、出版日が近いグループの一覧
    const currentMatchList = [...results]
      .reverse()
      .filter(({ next, list }) => volume === next - 1 && isNearDateBook(list[list.length - 1], book));
    if (currentMatchList.length) {
      // 特別な条件に当てはまればそちらのグループを優先する
      if (matchSet(book, currentMatchList, 0, ({ title }) => title === book.title)) return;
      if (matchSet(book, currentMatchList, 0, ({ edition }) => edition === book.edition)) return;
      // グループ一覧の最後に適用するのが通常
      currentMatchList[0].list.push(book);
      return;
    }

    results.push({ first: volume, next: volume + 1, list: [book] });
  });
  if (unSeriesList.length) results.push({ first: -1, next: -1, list: unSeriesList });
  return results;
};
