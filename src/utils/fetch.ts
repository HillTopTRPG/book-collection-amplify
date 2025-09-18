import * as _ from 'es-toolkit/compat';
import { keys } from 'es-toolkit/compat';

import ndc8Map from '@/assets/ndc8.json';
import ndc9Map from '@/assets/ndc9.json';
import { getKeys } from '@/utils/type.ts';

import type { BookData } from '../types/book.ts';

const NDC_MAPS = {
  ndc8: ndc8Map,
  ndc9: ndc9Map,
} as const;

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
      title: book.title,
      volume: book.subtitle,
      creator: book.author ? [book.author] : [],
      publisher: book.publisher,
      date: book.pubdate,
      cover: book.cover,
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
      title: data.items[0].volumeInfo?.title,
      volume: data.items[0].volumeInfo?.subtitle,
      creator: data.items[0].volumeInfo?.authors,
      publisher: data.items[0].volumeInfo?.publisher,
      date: data.items[0].volumeInfo?.publishedDate,
      cover: data.items[0].volumeInfo?.imageLinks?.thumbnail,
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
          isbn: item.isbn.replaceAll('-', ''),
          title: item.title,
          volume: item.subTitle,
          creator: item.author ? [item.author] : [],
          publisher: item.publisherName,
          date: item.salesDate,
          cover: item.mediumImageUrl,
        } as const satisfies BookData];
      });
  } catch (error) {
    console.error('Rakuten Books API エラー:', error);
    return [];
  }
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

const parser = new DOMParser();
const getNdlBookFromDocument = (recordElm: Element) => {
  const resourceElm = recordElm.querySelector('recordData > RDF > BibResource');
  const isbn = Array.from(resourceElm?.querySelectorAll('identifier') ?? []).find(isbnElm => isbnElm.getAttribute('rdf:datatype') === 'http://ndl.go.jp/dcndl/terms/ISBN')?.textContent?.replaceAll('-', '') ?? null;
  if (!isbn) return null;

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
  const ndcInfo = Array.from(resourceElm?.querySelectorAll('subject') ?? []).flatMap(subjectElm => {
    const resource = subjectElm.getAttribute('rdf:resource') ?? '';
    const sp = resource.split('/');
    const rawNdcType = sp.at(-2);
    const ndcCode = sp.at(-1);
    const ndcType: 'ndc8' | 'ndc9' = rawNdcType === 'ndc8' ? 'ndc8' : 'ndc9';
    if (!rawNdcType?.startsWith('ndc') || !ndcCode) return [];

    return [{
      rawNdcType,
      ndcCode,
      ndcType,
    }];
  }).at(0) ?? null;

  const ndc = ndcInfo ? `${ndcInfo.rawNdcType}:${ndcInfo.ndcCode}` : null;
  const ndcLabel = ((): string | null => {
    if (!ndcInfo) return null;
    const { ndcType, ndcCode, rawNdcType } = ndcInfo;
    const dataMap = NDC_MAPS[ndcType];
    const ndc = `${ndcType}:${ndcCode}`;

    let label: string | null = getKeys(dataMap).some(v => v === ndc) ? dataMap[ndc as keyof typeof dataMap] : null;

    if (!label && rawNdcType !== ndcType) {
      for (let i = 1; i < ndcCode.length; i++) {
        const ndc = `${ndcType}:${ndcCode.substring(0, ndcCode.length - i)}`;
        label = getKeys(dataMap).some(v => v === ndc) ? dataMap[ndc as keyof typeof dataMap] : null;
        if (label) break;
      }
    }
    return label;
  })();

  return {
    isbn,
    title,
    volume,
    volumeTitle,
    creator,
    publisher,
    seriesTitle,
    edition,
    date,
    ndc,
    ndcLabel,
    cover: isbn ? `https://ndlsearch.ndl.go.jp/thumbnail/${isbn.replaceAll('-', '')}.jpg` : null,
  } as const satisfies BookData;
};

export const fetchNdlSearch = async (options: NdlOptions) => {
  const BASE_URL = 'https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordPacking=xml&recordSchema=dcndl&startRecord=1&maximumRecords=200&query=';
  const query = getNdlQuery(options);
  console.log(query);
  const response = await fetch(`${BASE_URL}${encodeURIComponent(query)}`);
  const text = await response.text();

  return Array
    .from(parser.parseFromString(text, 'text/xml').querySelectorAll('records > record'))
    .flatMap(recordElm => {
      const book = getNdlBookFromDocument(recordElm);

      return book ? [book] : [];
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

  const wrapImageCheck = async (_: string, url: string | null | undefined) => {
    if (!url) return null;
    if (url) {
      const result = await checkIfImageExists(url);
      // console.log(label, result);

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
