import type { FilterBean, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData, BookDetail } from '@/types/book.ts';
import { isNil } from 'es-toolkit/compat';
import { getKeys } from '@/utils/type.ts';

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

const EMPTY_BOOK_DETAIL_ARRAY: BookDetail[] = [];
const EMPTY_STRING_ARRAY: string[] = [];

// book properties のキャッシュ
const bookPropertiesCache = new WeakMap<BookData, string[]>();

const getBookProperties = (book: BookData): string[] => {
  if (bookPropertiesCache.has(book)) {
    return bookPropertiesCache.get(book)!;
  }
  const properties = getKeys(book).flatMap(property => {
    const value = book[property];
    if (isNil(value)) return EMPTY_STRING_ARRAY;
    if (typeof value === 'string') return [value];
    return value;
  });
  bookPropertiesCache.set(book, properties);
  return properties;
};

export const getFilteredItems = (
  bookDetails: BookDetail[],
  filterSet: FilterSet,
  filterIndex?: number
): BookDetail[] => {
  if (!bookDetails.length) return EMPTY_BOOK_DETAIL_ARRAY;

  if (filterIndex !== undefined) {
    const filters = filterSet.filters[filterIndex].list.filter(({ keyword }) => keyword);
    if (!filters.length) return !filterIndex ? bookDetails : EMPTY_BOOK_DETAIL_ARRAY;
  }

  return bookDetails.filter(bookDetail =>
    filterSet.filters.some(({ list }, idx) => {
      if (filterIndex !== undefined && idx !== filterIndex) return false;
      return list.every(filter => isMatch(filter, getBookProperties(bookDetail.book)));
    })
  );
};
