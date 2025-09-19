import * as _ from 'es-toolkit/compat';
import { keys } from 'es-toolkit/compat';
import ndc8Map from '@/assets/ndc8.json';
import ndc9Map from '@/assets/ndc9.json';
import { getIsbn13 } from '@/utils/primitive.ts';
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
      return { isbn, ndcLabels: [] };
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
      ndcLabels: [],
    } as const satisfies BookData;
  } catch (error) {
    console.error('openBD API エラー:', error);
    return { isbn, ndcLabels: [] };
  }
};

export const fetchGoogleBooksApi = async (isbn: string): Promise<BookData> => {
  let data;
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    data = await response.json();
  } catch (error) {
    console.log('$$ google error');
    console.log(JSON.stringify(error, null, 2));
    throw new Error('other');
  }

  if (!data?.items?.length) {
    if (data.totalItems === 0) {
      throw new Error('no-exists');
    }
    if (data?.error?.errors?.some((error: { reason: string | null } | null) => error?.reason === 'rateLimitExceeded')) {
      throw new Error('need-retry');
    }
    console.log('$$ google illegal response');
    console.log(JSON.stringify(data, null, 2));
    throw new Error('other');
  }

  if (!data.items[0].volumeInfo?.imageLinks?.thumbnail) {
    console.log('google cant have image but got info: ', data.items[0].volumeInfo?.title);
  }

  return {
    isbn,
    title: data.items[0].volumeInfo?.title,
    volume: data.items[0].volumeInfo?.subtitle,
    creator: data.items[0].volumeInfo?.authors,
    publisher: data.items[0].volumeInfo?.publisher,
    date: data.items[0].volumeInfo?.publishedDate,
    cover: data.items[0].volumeInfo?.imageLinks?.thumbnail,
    ndcLabels: [],
  } as const satisfies BookData;
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
  const params = keys
    .flatMap(option => {
      const value = opt[option]?.toString();

      return value ? [`&${option}=${encodeURIComponent(value)}`] : [];
    })
    .join('');

  let data;
  try {
    const response = await fetch(
      `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json${params}`
    );
    data = await response.json();
  } catch (error) {
    console.log('$$ rakuten error');
    console.log(JSON.stringify(error, null, 2));
    throw new Error('other');
  }

  if (!data['Items']) {
    if (data['error']) {
      if (data['error'] === 'too_many_requests') throw new Error('need-retry');
      console.log('$$ rakuten illegal response');
      console.log(JSON.stringify(data, null, 2));
      throw new Error(data['error']);
    }
    console.log('$$ rakuten illegal response');
    console.log(JSON.stringify(data, null, 2));
    throw new Error('other');
  }

  return data['Items']
    .map(({ Item: item }: { Item: RakutenBook }) => item)
    .flatMap((item: RakutenBook) => {
      // isbnコード必須
      if (!item.isbn) return [];
      // // まとめ売りの商品は除外
      // if (item.booksGenreId?.startsWith('001025')) return [];

      if (!item.mediumImageUrl) {
        console.log('rakuten cant have image but got info: ', item.title);
      }

      return [
        {
          isbn: item.isbn.replaceAll('-', ''),
          title: item.title,
          volume: item.subTitle,
          creator: item.author ? [item.author] : [],
          publisher: item.publisherName,
          date: item.salesDate,
          cover: item.mediumImageUrl,
          ndcLabels: [],
        } as const satisfies BookData,
      ];
    });
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

  return (
    _keys
      .flatMap(key => {
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
      .join(' and ') + ' and sortBy=issued_date/sort.ascending'
  );
};

const parser = new DOMParser();
const getNdlBookFromDocument = (recordElm: Element) => {
  const resourceElm = recordElm.querySelector('recordData > RDF > BibResource');
  const maybeIsbn =
    Array.from(resourceElm?.querySelectorAll('identifier') ?? [])
      .find(isbnElm => isbnElm.getAttribute('rdf:datatype') === 'http://ndl.go.jp/dcndl/terms/ISBN')
      ?.textContent?.replaceAll('-', '') ?? null;
  if (!maybeIsbn || ![10, 13].includes(maybeIsbn.length)) return null;

  const isbn = getIsbn13(maybeIsbn);

  const title = resourceElm?.querySelector('title > Description > value')?.textContent ?? null;
  const publisher = resourceElm?.querySelector('publisher > Agent > name')?.textContent ?? null;
  const creator = Array.from(resourceElm?.querySelectorAll('creator > Agent > name') ?? []).map(
    creatorElm => creatorElm?.textContent ?? ''
  );
  if (!creator.length) {
    const creatorText = resourceElm
      ?.querySelector('creator')
      ?.textContent?.replace(/著$/, '')
      .trim()
      .replace(/\/$/, '')
      .trim();
    if (creatorText) {
      creator.push(creatorText);
    }
  }
  const date = resourceElm?.querySelector('date')?.textContent ?? null;
  const volume = resourceElm?.querySelector('volume > Description > value')?.textContent ?? null;
  const volumeTitle = resourceElm?.querySelector('volumeTitle > Description > value')?.textContent ?? null;
  const seriesTitle = resourceElm?.querySelector('seriesTitle > Description > value')?.textContent ?? null;
  const edition = resourceElm?.querySelector('edition')?.textContent ?? null;
  const extent = resourceElm?.querySelector('extent')?.textContent ?? null;
  const ndcInfo =
    Array.from(resourceElm?.querySelectorAll('subject') ?? [])
      .flatMap(subjectElm => {
        const resource = subjectElm.getAttribute('rdf:resource') ?? '';
        const sp = resource.split('/');
        const rawNdcType = sp.at(-2);
        const ndcCode = sp.at(-1);
        const ndcType: 'ndc8' | 'ndc9' = rawNdcType === 'ndc8' ? 'ndc8' : 'ndc9';
        if (!rawNdcType?.startsWith('ndc') || !ndcCode) return [];

        return [
          {
            rawNdcType,
            ndcCode,
            ndcType,
          },
        ];
      })
      .at(0) ?? null;

  const ndc = ndcInfo ? `${ndcInfo.rawNdcType}:${ndcInfo.ndcCode}` : null;
  const ndcLabels = ((): string[] => {
    if (!ndcInfo) return [];
    const { ndcType, ndcCode } = ndcInfo;
    const dataMap = NDC_MAPS[ndcType];
    const ndc = `${ndcType}:${ndcCode}`;

    return [...Array(ndc.length - 5)].flatMap((_, i) => {
      const code = ndc.slice(0, 6 + i);
      if (code.endsWith('.')) return [];
      const text = dataMap[code as keyof typeof dataMap];

      return text ? [text] : [];
    });
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
    ndcLabels,
    cover: isbn ? `https://ndlsearch.ndl.go.jp/thumbnail/${isbn.replaceAll('-', '')}.jpg` : null,
    extent,
  } as const satisfies BookData;
};

export const fetchNdlSearch = async (options: NdlOptions) => {
  const BASE_URL =
    'https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordPacking=xml&recordSchema=dcndl&startRecord=1&maximumRecords=200&query=';
  const query = getNdlQuery(options);
  console.log(query);
  const response = await fetch(`${BASE_URL}${encodeURIComponent(query)}`);
  const text = await response.text();

  return Array.from(parser.parseFromString(text, 'text/xml').querySelectorAll('records > record')).flatMap(
    recordElm => {
      const book = getNdlBookFromDocument(recordElm);

      return book ? [book] : [];
    }
  );
};

const checkIfImageExists = async (url: string | null | undefined) =>
  new Promise<boolean>(resolve => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const getAsyncUrl = async (
  type: 'rakuten' | 'google',
  isbn: string,
  callback: (isbn: string) => Promise<string | null>
) =>
  new Promise<GetBookImagePromiseInfo>(resolve => {
    callback(isbn)
      .then(url => {
        resolve({ url, type, error: null });
      })
      .catch(error => {
        console.log('$$$ getAsyncUrl catch', type, isbn, error.toString());
        resolve({ url: null, type, error: error?.message ?? null });
      });
  });

type GetBookImagePromiseInfo = { url: string | null; type: 'ndl' | 'rakuten' | 'google'; error: string | null };

export const getBookImageUrl = async (isbn: string): Promise<GetBookImagePromiseInfo> => {
  const ndlUrl = `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`;
  if (await checkIfImageExists(ndlUrl)) {
    return {
      url: ndlUrl,
      type: 'ndl',
      error: null,
    };
  }

  const results = await Promise.all([
    getAsyncUrl('google', isbn, async isbn => (await fetchGoogleBooksApi(isbn)).cover ?? null),
    getAsyncUrl(
      'rakuten',
      isbn,
      async isbn => (await fetchRakutenBooksApi({ isbn })).find(book => book.cover)?.cover ?? null
    ),
  ]);

  const haveUrl = results.find(result => result.url);
  if (haveUrl) return haveUrl;

  const needRetry = results.find(result => result.error === 'need-retry');
  if (needRetry) return needRetry;

  return {
    url: null,
    type: 'rakuten',
    error: 'other',
  };
};
