
// openBD APIから書籍データを取得
import {BookData} from '../types/book.ts';
import * as _ from 'es-toolkit/compat';

// 楽天 Books APIの認証情報（ローカル環境では .env ファイルから取得）
const RAKUTEN_API_APPLICATION_ID: string = import.meta.env.VITE_RAKUTEN_API_APPLICATION_ID;

export async function fetchOpenBdApi(isbn: string): Promise<BookData> {
  try {
    const response = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    const data = await response.json();

    if (!data || !data[0] || !data[0].summary) {
      return { isbn };
    }

    const book = data[0].summary;

    return {
      isbn,
      title: book.title || null,
      subtitle: book.subtitle || null,
      author: book.author || null,
      publisher: book.publisher || null,
      pubdate: book.pubdate || null,
      cover: book.cover || null
    };
  } catch (error) {
    console.error('openBD API エラー:', error);
    return { isbn };
  }
}

export async function fetchGoogleBooksApi(isbn: string): Promise<BookData> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();

    if (!data?.items || !data.items[0]) {
      return { isbn };
    }
    return {
      isbn,
      title: data.items[0].volumeInfo?.title || null,
      subtitle: data.items[0].volumeInfo?.subtitle || null,
      author: data.items[0].volumeInfo?.authors.join(',') || null,
      publisher: data.items[0].volumeInfo?.publisher || null,
      pubdate: data.items[0].volumeInfo?.publishedDate || null,
      cover: data.items[0].volumeInfo?.imageLinks?.thumbnail ?? null,
    };
  } catch (error) {
    console.error('Google Books API エラー:', error);
    return { isbn };
  }
}

export type RakutenApiOption = {
  title?: string;
  author?: string;
  publisherName?: string;
  size?: number;
  isbn?: string;
  booksGenreId?: string;
  sort?: '+releaseDate' | '-releaseDate';
  applicationId?: string;
  page?: number;
};
type RakutenBook = {
  author?: string;
  booksGenreId?: string;
  isbn?: string;
  mediumImageUrl?: string;
  publisherName?: string;
  salesDate?: string;
  subTitle?: string;
  title?: string;
};
export async function fetchRakutenBooksApi(options: RakutenApiOption): Promise<BookData[]> {
  const opt = structuredClone(options);
  opt.applicationId ??= RAKUTEN_API_APPLICATION_ID;
  opt.booksGenreId ??= '001';
  const keys = _.keys(opt) as (keyof RakutenApiOption)[];
  const params = keys.flatMap((option) => {
    const value = opt[option];
    console.log(option, value, encodeURIComponent(value?.toString() ?? ''));
    return value ? [`&${option}=${encodeURIComponent(value.toString())}`] : [];
  }).join('');
  const response = await fetch(`https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json${params}`);
  const data = await response.json();
  return data['Items']
    .map(({Item: item}: {Item: RakutenBook}) => item)
    .filter((item: RakutenBook) => !item.booksGenreId?.startsWith('001025'))
    .map((item: RakutenBook) => {
      return ({
        isbn: item.isbn ?? null,
        title: item.title ?? null,
        subtitle: item.subTitle ?? null,
        author: item.author ?? null,
        publisher: item.publisherName ?? null,
        pubdate: item.salesDate ?? null,
        cover: item.mediumImageUrl ?? null,
      });
    });
}