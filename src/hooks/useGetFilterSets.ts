import { useAppSelector } from '@/store/hooks.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

export default function useGetFilterSets() {
  const dbFilterSets = useAppSelector(selectFilterSets);

  return {
    getFilterSets: (book: BookData | null) => {
      if (!book?.title) return [];

      const list = dbFilterSets.filter(filterSet => {
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
    }
  };
}
