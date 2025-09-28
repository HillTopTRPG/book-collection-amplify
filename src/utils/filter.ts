import type { FilterBean, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
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
