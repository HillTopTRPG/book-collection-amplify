import type { Isbn13 } from '@/types/book.ts';
import { getKeys } from '@/utils/type.ts';

export const sortString = (a: string | null | undefined, b: string | null | undefined, sortOrder: 'asc' | 'desc') => {
  if (a === b) return 0;
  return ((a ?? '') > (b ?? '') ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1);
};

export const getIsbnCode = (rawCode: string | null | undefined): string | null => {
  const code = rawCode?.replaceAll('-', '');
  if (!code || ![10, 13].some(v => v === code.length)) return null;
  if (code.length === 13 && !/^[0-9]{13}$/.test(code)) return null;
  if (code.length === 10 && !/^[0-9]{9}[0-9X]$/.test(code)) return null;

  const isbnPart = code.slice(0, -1);
  const getCheckDigit = code.length === 13 ? getIsbn13CheckDigit : getIsbn10CheckDigit;
  const isbn = `${isbnPart}${getCheckDigit(isbnPart)}`;

  return isbn === code ? isbn : null;
};

export const getIsbn10CheckDigit = (isbn10Part: string) => {
  const checkDigit =
    11 - (isbn10Part.split('').reduce<number>((acc, cur, idx) => acc + parseInt(cur) * (10 - idx), 0) % 11);
  if (checkDigit === 11) return '0';
  if (checkDigit === 10) return 'X';

  return checkDigit.toString();
};

export const getIsbn13CheckDigit = (isbn13Part: string) => {
  const checkDigit =
    10 - (isbn13Part.split('').reduce<number>((acc, cur, i) => acc + (i % 2 ? 3 : 1) * parseInt(cur), 0) % 10);
  if (checkDigit === 10) return '0';

  return checkDigit.toString();
};

export const getIsbnWithHyphen = (isbn: string, len: 10 | 13) => {
  const pureIsbn = isbn.replaceAll('-', '');
  const list: string[] = [];
  const idx = pureIsbn.length - 10;
  if (len === 13) list.push(pureIsbn.slice(0, idx) || '978');
  list.push(pureIsbn.slice(idx, idx + 1));
  const num = parseInt(pureIsbn.slice(idx + 1, idx + 3));
  const s3End = [20, 70, 85, 90, 95].findIndex(n => num < n) + idx + 3;
  list.push(pureIsbn.slice(idx + 1, s3End));
  list.push(pureIsbn.slice(s3End, -1));
  list.push(len === 10 ? getIsbn10CheckDigit(list.join('')) : getIsbn13CheckDigit(list.join('')));

  return list.join('-');
};

export const getIsbn13 = (isbn: string): Isbn13 => {
  const maybeIsbn10 = isbn.replaceAll('-', '');
  if (maybeIsbn10.length === 13) return maybeIsbn10 as Isbn13;
  const isbn13part = `978${maybeIsbn10.slice(0, -1)}`;

  return `${isbn13part}${getIsbn13CheckDigit(isbn13part)}` as Isbn13;
};

export const unique = <T>(list: T[]) => list.filter((v, i, s) => s.findIndex(a => a === v) === i);

export const getIsbn10 = (isbn: string): string => {
  const maybeIsbn13 = isbn.replaceAll('-', '');
  if (maybeIsbn13.length === 10) return maybeIsbn13;
  const isbn10part = maybeIsbn13.slice(3, -1);

  return `${isbn10part}${getIsbn10CheckDigit(isbn10part)}`;
};

export const convertPubdate = (pubdate: string | null | undefined) => {
  if (!pubdate) return '';
  pubdate = pubdate
    .replace('年', '-')
    .replace('月', '-')
    .replace(/[日頃初中下旬]/g, '');
  return new Date(pubdate).toLocaleDateString('sv-SE');
};

export const filterMatch =
  <Conditions extends Record<string, unknown>>(conditions: Conditions): ((obj: Conditions) => boolean) =>
  obj =>
    getKeys(conditions).some(key => conditions[key] === obj[key]);

type PickSameProperties<T1, T2> = Pick<
  T1,
  {
    [K in keyof T1 & keyof T2]: T1[K] extends T2[K] ? (T1[K] extends T2[K] ? K : never) : never;
  }[keyof T1 & keyof T2]
>;

export const filterArrayByKey = <Array1 extends Record<string, unknown>[]>(
  array1: Array1,
  array2: Record<string, unknown>[],
  property: keyof PickSameProperties<Array1[number], (typeof array2)[number]>
): Array1 => array1.filter(item1 => array2.some(item2 => item1[property] === item2[property])) as Array1;
export const excludeArrayByKey = <Array1 extends Record<string, unknown>[]>(
  array1: Array1,
  array2: Record<string, unknown>[],
  property: keyof PickSameProperties<Array1[number], (typeof array2)[number]>
): Array1 => array1.filter(item1 => !array2.some(item2 => item1[property] === item2[property])) as Array1;

export const wait = async (ms: number): Promise<void> => void (await new Promise(resolve => setTimeout(resolve, ms)));
