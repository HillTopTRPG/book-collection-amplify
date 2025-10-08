import type { Isbn13 } from '@/types/book.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import { deleteAllStrings, unique } from '@/utils/primitive.ts';
import { getKeys } from '@/utils/type.ts';

type LocalStorageBookImageData =
  | ['n']
  | ['n', string]
  | ['r', string]
  | ['r', string, string]
  | ['r2', string]
  | ['r2', string, string]
  | ['g', string]
  | ['g2', string]
  | string;

const parseLocalStorageBookImageData = (url: string, isbn: Isbn13): LocalStorageBookImageData => {
  console.log(isbn, url);
  const ndlIsbn = url.match(/^https:\/\/ndlsearch\.ndl\.go\.jp\/thumbnail\/(.+?)\.jpg$/)?.at(1);
  if (ndlIsbn) {
    if (ndlIsbn === isbn) return ['n'];
    return ['n', ndlIsbn];
  }
  // 例) https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/1276/9784088511276.jpg?_ex=200x200
  const rakuten = url.match(
    /^https:\/\/thumbnail\.image\.rakuten\.co\.jp\/@0_mall\/book\/cabinet\/(.+?)\/(.+?)\.jpg\?_ex=200x200$/
  );
  if (rakuten) {
    const cabinet = rakuten[1];
    const rakutenIsbn = rakuten[2];
    if (rakutenIsbn === isbn) return ['r', cabinet];
    if (!rakutenIsbn.includes('_')) return ['r', cabinet, rakutenIsbn];
    const sliced = rakutenIsbn.match(/^(.+?)_([^_]+_[^_]+)$/)?.slice(1);
    if (sliced?.at(0) === isbn) return ['r2', cabinet, sliced[1]];
    return ['r', cabinet, rakutenIsbn];
  }
  // 例) http://books.google.com/books/content?id=Ng3XygAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api
  const google = url.match(/^http:\/\/books\.google\.com\/books\/content\?id=(.+?)$/);
  if (google) {
    if (google[1].endsWith('&printsec=frontcover&img=1&zoom=1&source=gbs_api')) {
      return ['g', google[1].replace('&printsec=frontcover&img=1&zoom=1&source=gbs_api', '')];
    }
    return ['g2', google[1]];
  }
  return url;
};

const stringifyLocalStorageBookImageData = (list: LocalStorageBookImageData, isbn: Isbn13): string => {
  if (typeof list === 'string') return list;
  switch (list[0]) {
    case 'n':
      return `https://ndlsearch.ndl.go.jp/thumbnail/${list.at(1) ?? isbn}.jpg`;
    case 'r':
      return `https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/${list.at(1)}/${list.at(2) ?? isbn}.jpg?_ex=200x200`;
    case 'r2':
      return `https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/${list.at(1)}/${isbn}_${list.at(2) ?? isbn}.jpg?_ex=200x200`;
    case 'g':
      return `http://books.google.com/books/content?id=${list.at(1)}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
    case 'g2':
      return `http://books.google.com/books/content?id=${list.at(1)}`;
    default:
      return list[0];
  }
};

const LocalStorageKeys = {
  // スキャンしたISBNコードの配列
  scan: 'scan',
  bookImages: 'bookImages',
};

const getLocalStorage = <T>(key: keyof typeof LocalStorageKeys): T | undefined => {
  const scanListText = localStorage.getItem(LocalStorageKeys[key]);

  return !scanListText ? undefined : (JSON.parse(scanListText) as T);
};

export const getScannedIsbnToLocalStorage = (): Isbn13[] =>
  getLocalStorage<string[]>('scan')?.flatMap(str => {
    const rawIsbn = getIsbnCode(str);

    return rawIsbn ? [getIsbn13(rawIsbn)] : [];
  }) ?? [];

export const getBookImagesToLocalStorage = (): Record<Isbn13, string> => {
  const result = getLocalStorage<Record<Isbn13, LocalStorageBookImageData>>('bookImages') ?? {};

  return getKeys(result).reduce<Record<Isbn13, string>>((acc, isbn) => {
    acc[isbn] = stringifyLocalStorageBookImageData(result[isbn], isbn);
    return acc;
  }, {});
};

export const pushScannedIsbnToLocalStorage = (isbnList: Isbn13[]) => {
  const list = getScannedIsbnToLocalStorage();
  list.push(...isbnList);
  localStorage.setItem(LocalStorageKeys.scan, JSON.stringify(unique(list)));
};

const BOOK_IMAGE_LOCAL_STORAGE_MAX_SIZE = 2048 * 1024;

export const pushBookImageToLocalStorage = (info: Record<Isbn13, string | null>) => {
  const setInfo = getKeys(info).reduce<Record<Isbn13, LocalStorageBookImageData>>((acc, isbn) => {
    const url = info[isbn];
    if (url && url !== 'retrying') acc[isbn] = parseLocalStorageBookImageData(url, isbn);
    return acc;
  }, {});
  const prev = getLocalStorage<Record<Isbn13, LocalStorageBookImageData>>('bookImages') ?? {};
  const nextInfo = { ...prev, ...setInfo };
  while (JSON.stringify(nextInfo).length > BOOK_IMAGE_LOCAL_STORAGE_MAX_SIZE) {
    const deleteKey = getKeys(nextInfo).at(0)!;
    delete nextInfo[deleteKey];
  }
  localStorage.setItem(LocalStorageKeys.bookImages, JSON.stringify(nextInfo));
};

export const deleteScannedIsbnToLocalStorage = (isbnList: Isbn13[]) => {
  const list = getScannedIsbnToLocalStorage();
  deleteAllStrings(list, isbnList);
  localStorage.setItem(LocalStorageKeys.scan, JSON.stringify(list));
};

export const resetScannedIsbnToLocalStorage = () => {
  localStorage.setItem(LocalStorageKeys.scan, '[]');
};
