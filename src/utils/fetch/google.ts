import type { BookData, Isbn13 } from '@/types/book.ts';
import type { FetchProcessResult } from '@/utils/fetch';
import { fetchData } from '@/utils/fetch';

export const callGoogleBooksApi = async (isbn: Isbn13): Promise<FetchProcessResult<BookData | null>> => {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const { data, retry, error } = await fetchData(url);
  if (!data) return { value: null, retry, error };

  if (!data.items?.length) {
    if (data.totalItems === 0) return { value: null, error: null, retry: false };
    console.log('$$ google illegal response');
    console.log(JSON.stringify(data, null, 2));
    const error: string | null =
      data.error?.errors
        ?.map((error: Record<string, unknown>) => ('reason' in error ? error['reason'] : undefined))
        ?.find(Boolean) ?? null;

    return { value: null, error, retry: false };
  }

  const item = data.items[0].volumeInfo;

  const value = {
    apiId: '',
    isbn,
    title: item?.title,
    volume: item?.subtitle,
    creator: item?.authors,
    publisher: item?.publisher,
    date: item?.publishedDate,
    cover: item?.imageLinks?.thumbnail,
    ndcLabels: [],
  } as const satisfies BookData;

  return { value, error: null, retry: false };
};
