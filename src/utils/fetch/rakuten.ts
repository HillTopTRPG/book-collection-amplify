// 楽天 Books APIの認証情報（ローカル環境では .env ファイルから取得）
import type { BookData, Isbn13 } from '@/types/book.ts';
import type { RakutenApiOption } from '@/types/fetch.ts';
import type { FetchProcessResult } from '@/utils/fetch';
import { fetchData } from '@/utils/fetch';
import { getIsbnCode } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

const RAKUTEN_API_APPLICATION_ID: string = import.meta.env.VITE_RAKUTEN_API_APPLICATION_ID;

export const callRakutenBooksApi = async (isbn: Isbn13): Promise<FetchProcessResult<BookData | null>> => {
  const opt: RakutenApiOption = { isbn };
  opt.applicationId ??= RAKUTEN_API_APPLICATION_ID;
  opt.booksGenreId ??= '001';
  const params = getKeys(opt)
    .flatMap(option => {
      const value = opt[option]?.toString();

      return value ? [`&${option}=${encodeURIComponent(value)}`] : [];
    })
    .join('');

  const url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json${params}`;
  const { data, retry, error } = await fetchData(url);
  if (!data) return { value: null, retry, error };

  if (!data['Items']) {
    console.log('$$ rakuten illegal response');
    console.log(JSON.stringify(data, null, 2));
    return { value: null, error: data['error']?.toString() || 'other', retry: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = data['Items'].flatMap(({ Item }: any) => (!getIsbnCode(Item.isbn) ? [] : [Item])).at(0) ?? null;

  const value: BookData = {
    isbn,
    title: item?.title,
    volume: item?.subTitle,
    creator: item?.author ? [item?.author] : [],
    publisher: item?.publisherName,
    date: item?.salesDate,
    cover: item?.largeImageUrl,
    ndcLabels: [],
  };

  return { value, error: null, retry: false };
};
