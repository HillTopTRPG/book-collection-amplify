import * as _ from 'es-toolkit/compat';
import { keys } from 'es-toolkit/compat';

import type { FilterSet } from '@/store/subscriptionDataSlice.ts';

import type { BookData } from '../types/book.ts';

// 楽天 Books APIの認証情報（ローカル環境では .env ファイルから取得）
const RAKUTEN_API_APPLICATION_ID: string = import.meta.env.VITE_RAKUTEN_API_APPLICATION_ID;

// openBD APIから書籍データを取得
export const fetchOpenBdApi = async (isbn: string): Promise<BookData> => {
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
    } as const satisfies BookData;
  } catch (error) {
    console.error('openBD API エラー:', error);
    return { isbn };
  }
};

export const fetchGoogleBooksApi = async (isbn: string): Promise<BookData> => {
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
      author: data.items[0].volumeInfo?.authors?.join(',') || null,
      publisher: data.items[0].volumeInfo?.publisher || null,
      pubdate: data.items[0].volumeInfo?.publishedDate || null,
      cover: data.items[0].volumeInfo?.imageLinks?.thumbnail ?? null,
    } as const satisfies BookData;
  } catch (error) {
    console.error('Google Books API エラー:', error);
    return { isbn };
  }
};

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
export const fetchRakutenBooksApi = async (options: RakutenApiOption): Promise<BookData[]> => {
  const opt = structuredClone(options);
  opt.applicationId ??= RAKUTEN_API_APPLICATION_ID;
  opt.booksGenreId ??= '001';
  const keys = _.keys(opt) as (keyof RakutenApiOption)[];
  const params = keys.flatMap((option) => {
    const value = opt[option]?.toString();

    return value ? [`&${option}=${encodeURIComponent(value)}`] : [];
  }).join('');

  try {
    const response = await fetch(`https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json${params}`);
    const data = await response.json();

    if (!data['Items']) return [];

    return data['Items']
      .map(({ Item: item }: {Item: RakutenBook}) => item)
      .flatMap((item: RakutenBook) => {
        // isbnコード必須
        if (!item.isbn) return [];
        // まとめ売りの商品は除外
        if (item.booksGenreId?.startsWith('001025')) return [];

        return [{
          isbn: item.isbn,
          title: item.title ?? null,
          subtitle: item.subTitle ?? null,
          author: item.author ?? null,
          publisher: item.publisherName ?? null,
          pubdate: item.salesDate ?? null,
          cover: item.mediumImageUrl ?? null,
        } as const satisfies BookData];
      });
  } catch (error) {
    console.error('Rakuten Books API エラー:', error);
    return [];
  }
};

export const fetchBooksByFilterSet = async (filterSet: FilterSet) => {
  const option: RakutenApiOption = {};
  filterSet.filters.forEach(({ type, value }) => {
    if (!value) return;
    let property: keyof RakutenApiOption;
    switch (type) {
      case 'title':
      case 'author':
        property = type;
        break;
      case 'publisher':
        property = 'publisherName';
        break;
      default:
        return;
    }
    if (option[property]) return;
    option[property] = value;
  });
  if (!option.sort) {
    const filter = filterSet.filters.find((filter) => filter.type === 'pubdate');
    option.sort = filter?.sortOrder === 'desc' ? '+releaseDate' : '-releaseDate';
  }
  return fetchRakutenBooksApi(option);
};

export type NdlOptions = {
  title?: string;
  creator?: string;
  publisher?: string;
  isbn?: string;
  dpid?: string;
  mediatype?: string;
  anywhere?: string;
};
const getNdlQuery = (options: NdlOptions) => {
  options.dpid ||= 'book';
  options.mediatype ||= 'books';
  const _keys = keys(options) as Array<keyof NdlOptions>;

  return _keys
    .flatMap((key) => {
      const value = options[key];
      if (!value) return [];
      switch (key) {
        case 'dpid':
        case 'mediatype':
        case 'title':
        case 'creator':
        case 'publisher':
        case 'anywhere':
          return [`${key}="${value}"`];
        case 'isbn':
          return [`${key}=${value}`];
        default:
          return [];
      }
    })
    .join(' and ') + ' and sortBy=issued_date/sort.ascending';
};

export type NdlResponse = {
  isbn: string | null;
  title: string | null;
  volume: string | null;
  volumeTitle: string | null;
  creator: string[];
  publisher: string | null;
  seriesTitle: string | null;
  edition: string | null;
  date: string | null;
  ndc: string | null;
};

const parser = new DOMParser();
const getNdlBookFromDocument = (recordElm: Element) => {
  const resourceElm = recordElm.querySelector('recordData > RDF > BibResource');
  const isbn = Array.from(resourceElm?.querySelectorAll('identifier') ?? []).find(isbnElm => isbnElm.getAttribute('rdf:datatype') === 'http://ndl.go.jp/dcndl/terms/ISBN')?.textContent ?? null;
  const title = resourceElm?.querySelector('title > Description > value')?.textContent ?? null;
  const publisher = resourceElm?.querySelector('publisher > Agent > name')?.textContent ?? null;
  const creator = Array.from(resourceElm?.querySelectorAll('creator > Agent > name') ?? []).map(creatorElm => creatorElm?.textContent ?? '');
  if (!creator.length) {
    const creatorText = resourceElm?.querySelector('creator')?.textContent?.replace(/著$/, '').trim().replace(/\/$/, '').trim();
    if (creatorText) {
      creator.push(creatorText);
    }
  }
  const date =  resourceElm?.querySelector('date')?.textContent ?? null;
  const volume = resourceElm?.querySelector('volume > Description > value')?.textContent ?? null;
  const volumeTitle = resourceElm?.querySelector('volumeTitle > Description > value')?.textContent ?? null;
  const seriesTitle = resourceElm?.querySelector('seriesTitle > Description > value')?.textContent ?? null;
  const edition = resourceElm?.querySelector('edition')?.textContent ?? null;
  const ndc = Array.from(resourceElm?.querySelectorAll('subject') ?? []).flatMap(subjectElm => {
    const resource = subjectElm.getAttribute('rdf:resource') ?? '';
    const sp = resource.split('/');

    return sp.at(-2)?.startsWith('ndc') ? [`${sp.at(-2)}/${sp.at(-1)}`] : [];
  }).at(0) ?? null;

  return {
    isbn, title, volume, volumeTitle, creator, publisher, seriesTitle, edition, date, ndc,
  } as const satisfies NdlResponse;
};

export const fetchNdlSearch = async (options: NdlOptions) => {
  const BASE_URL = 'https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordPacking=xml&recordSchema=dcndl&startRecord=1&maximumRecords=100&query=';
  const query = getNdlQuery(options);
  console.log(query);
  const response = await fetch(`${BASE_URL}${encodeURIComponent(query)}`);
  const text = await response.text();

  return Array
    .from(parser.parseFromString(text, 'text/xml').querySelectorAll('records > record'))
    .flatMap(recordElm => {
      const book = getNdlBookFromDocument(recordElm);

      return book.isbn && book.title ? [book] : [];
    });
};

export const checkIfImageExists = (url: string | null | undefined) => new Promise<string | null>((resolve) => {
  if (!url) return null;
  const img = new Image();
  // img.crossOrigin = 'anonymous';
  img.onload = () => resolve(url);
  img.onerror = () => resolve(null);
  img.src = url;
});

export const getBookImageUrl = async (props: { defaultUrl: string; isbn: string }): Promise<string | null> => {
  const isbn = props.isbn.replaceAll('-', '');

  const wrapImageCheck = async (label: string, url: string | null | undefined) => {
    console.log(label, 'start', url);
    if (!url) return null;
    if (url) {
      const result = await checkIfImageExists(url);
      console.log(label, result);
      return result;
    } else {
      // console.log(isbn, label, '失敗', url);
      return null;
    }
  };

  const ndlImageUrl = await wrapImageCheck('NDL', `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`);
  if (ndlImageUrl) return ndlImageUrl;

  const googleImageUrl = await wrapImageCheck('Google', (await fetchGoogleBooksApi(isbn))?.cover);
  if (googleImageUrl) return googleImageUrl;

  const rakutenImageUrl = await wrapImageCheck('楽天', (await fetchRakutenBooksApi({ isbn })).at(0)?.cover);
  if (rakutenImageUrl) return rakutenImageUrl;

  return null;
};
