import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import { filterMatch } from '@/utils/primitive.ts';

export const bookDataToBookDetail = (collections: Collection[], book: BookData): BookDetail => {
  const result: BookDetail = { book, isHave: false, isWant: false };
  const isbn = book.isbn;
  const collection = collections.find(filterMatch({ isbn }));
  if (collection) {
    result.isHave = true;
    result.isWant = collection.meta.isWant ?? false;
    result.book = { ...book, ...collection.meta.overwrite };
  }
  return result;
};

export const bookDataToFilterSets = (filterSets: FilterSet[], book: BookData | null): FilterSet[] => {
  if (!book?.title) return [];

  const list = filterSets.filter(filterSet => {
    filterSet.filters.every((filter) => !filter.value ? true : book[filter.type]?.includes(filter.value));
  });

  return list.length > 0 ? list : [{
    id: '',
    name: book.title,
    filters: [
      {
        type: 'title',
        value: book.title,
        sortOrder: 'asc',
      }
    ],
    meta: {},
    createdAt: '',
    updatedAt: '',
    owner: '',
  } as const satisfies FilterSet];
};
