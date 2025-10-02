import type { FilterBean, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
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

export const getFilteredItems = (
  bookDetails: BookDetail[],
  filterSet: FilterSet,
  filterIndex?: number
): BookDetail[] => {
  if (!bookDetails.length) return [];

  if (filterIndex !== undefined) {
    const filters = filterSet.filters[filterIndex].list.filter(({ keyword }) => keyword);
    if (!filters.length) return !filterIndex ? bookDetails : [];
  }

  return bookDetails.filter(bookDetail =>
    filterSet.filters.some(({ list }, idx) => {
      if (filterIndex !== undefined && idx !== filterIndex) return false;
      return list.every(filter =>
        isMatch(
          filter,
          getKeys(bookDetail.book).flatMap(property => {
            const value = bookDetail.book[property];
            if (isNil(value)) return [];
            if (typeof value === 'string') return [value];
            return value;
          })
        )
      );
    })
  );
};
