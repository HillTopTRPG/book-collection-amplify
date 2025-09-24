import {
  DEFAULT_ISBN_13_PREFIX,
  ISBN_10_BASE,
  ISBN_10_LENGTH,
  ISBN_10_PATTERN,
  ISBN_13_BASE,
  ISBN_13_LENGTH,
  ISBN_13_PATTERN,
  VALID_ISBN_LENGTHS,
} from '@/constant/isbn.ts';
import type { Isbn13 } from '@/types/book.ts';

type ValidIsbnLength = (typeof VALID_ISBN_LENGTHS)[number];

/**
 * 文字列からハイフンを除去する
 */
const removeHyphens = (text: string): string => text.replaceAll('-', '');

/**
 * ISBNの長さが有効かどうかを判定する
 */
const isValidIsbnLength = (length: number): length is ValidIsbnLength =>
  VALID_ISBN_LENGTHS.includes(length as ValidIsbnLength);

/**
 * ISBN-10の形式が正しいかどうかを検証する
 */
const isValidIsbn10Format = (code: string): boolean => code.length === ISBN_10_LENGTH && ISBN_10_PATTERN.test(code);

/**
 * ISBN-13の形式が正しいかどうかを検証する
 */
const isValidIsbn13Format = (code: string): boolean => code.length === ISBN_13_LENGTH && ISBN_13_PATTERN.test(code);

/**
 * ISBNの形式が正しいかどうかを検証する
 */
const isValidIsbnFormat = (code: string): boolean => {
  if (code.length === ISBN_10_LENGTH) return isValidIsbn10Format(code);
  if (code.length === ISBN_13_LENGTH) return isValidIsbn13Format(code);
  return false;
};

/**
 * ISBNのチェックディジットを検証する
 */
const validateIsbnCheckDigit = (code: string): boolean => {
  const isbnWithoutCheckDigit = code.slice(0, -1);
  const getCheckDigitFunction = code.length === ISBN_13_LENGTH ? getIsbn13CheckDigit : getIsbn10CheckDigit;
  const calculatedCheckDigit = getCheckDigitFunction(isbnWithoutCheckDigit);
  const actualCheckDigit = code.slice(-1);

  return actualCheckDigit === calculatedCheckDigit;
};

/**
 * 生のコード文字列からISBNコードを取得・検証する
 */
export const getIsbnCode = (rawCode: string | null | undefined): string | null => {
  if (!rawCode) return null;

  const cleanCode = removeHyphens(rawCode);

  if (!isValidIsbnLength(cleanCode.length)) return null;
  if (!isValidIsbnFormat(cleanCode)) return null;
  if (!validateIsbnCheckDigit(cleanCode)) return null;

  return cleanCode;
};

/**
 * ISBN-10の重み付き合計を計算する
 */
const calculateIsbn10WeightedSum = (isbn10Part: string): number =>
  isbn10Part.split('').reduce((sum, digit, index) => sum + parseInt(digit, 10) * (ISBN_10_LENGTH - index), 0);

/**
 * ISBN-13の重み付き合計を計算する
 */
const calculateIsbn13WeightedSum = (isbn13Part: string): number =>
  isbn13Part.split('').reduce((sum, digit, index) => sum + (index % 2 ? 3 : 1) * parseInt(digit, 10), 0);

/**
 * ISBN-10のチェックディジットを計算する
 */
export const getIsbn10CheckDigit = (isbn10Part: string): string => {
  const weightedSum = calculateIsbn10WeightedSum(isbn10Part);
  const checkDigit = ISBN_10_BASE - (weightedSum % ISBN_10_BASE);

  if (checkDigit === ISBN_10_BASE) return '0';
  if (checkDigit === ISBN_10_LENGTH) return 'X';

  return checkDigit.toString();
};

/**
 * ISBN-13のチェックディジットを計算する
 */
export const getIsbn13CheckDigit = (isbn13Part: string): string => {
  const weightedSum = calculateIsbn13WeightedSum(isbn13Part);
  const checkDigit = ISBN_13_BASE - (weightedSum % ISBN_13_BASE);

  if (checkDigit === ISBN_13_BASE) return '0';

  return checkDigit.toString();
};

/**
 * 出版社コード判定用の境界値
 */
const PUBLISHER_CODE_BOUNDARIES = [20, 70, 85, 90, 95] as const;

/**
 * ISBN-10のベースオフセット
 */
const ISBN_10_BASE_OFFSET = 10;

/**
 * 地域グループコードの長さ
 */
const REGION_GROUP_CODE_LENGTH = 1;

/**
 * 出版社コード判定数字の長さ
 */
const PUBLISHER_CODE_CHECK_LENGTH = 2;

/**
 * ISBN-10部分の開始インデックスを取得する
 */
const getIsbn10StartIndex = (isbnLength: number): number => isbnLength - ISBN_10_BASE_OFFSET;

/**
 * ISBN-13用のプレフィックスを取得する
 */
const getIsbn13Prefix = (pureIsbn: string, startIndex: number): string =>
  pureIsbn.slice(0, startIndex) || DEFAULT_ISBN_13_PREFIX;

/**
 * 地域グループコードを取得する
 */
const getRegionGroupCode = (pureIsbn: string, startIndex: number): string =>
  pureIsbn.slice(startIndex, startIndex + REGION_GROUP_CODE_LENGTH);

/**
 * 出版社コードの終了位置を計算する
 */
const calculatePublisherCodeEndPosition = (pureIsbn: string, startIndex: number): number => {
  const checkNumber = parseInt(
    pureIsbn.slice(
      startIndex + REGION_GROUP_CODE_LENGTH,
      startIndex + REGION_GROUP_CODE_LENGTH + PUBLISHER_CODE_CHECK_LENGTH
    ),
    10
  );
  const boundaryIndex = PUBLISHER_CODE_BOUNDARIES.findIndex(boundary => checkNumber < boundary);

  return boundaryIndex + startIndex + REGION_GROUP_CODE_LENGTH + PUBLISHER_CODE_CHECK_LENGTH;
};

/**
 * 出版社コードを取得する
 */
const getPublisherCode = (pureIsbn: string, startIndex: number, endIndex: number): string =>
  pureIsbn.slice(startIndex + REGION_GROUP_CODE_LENGTH, endIndex);

/**
 * 書籍コードを取得する
 */
const getBookCode = (pureIsbn: string, publisherCodeEndIndex: number): string =>
  pureIsbn.slice(publisherCodeEndIndex, -1);

/**
 * ISBNの各部分を分割する
 */
const splitIsbnParts = (pureIsbn: string, targetLength: 10 | 13): string[] => {
  const parts: string[] = [];
  const isbn10StartIndex = getIsbn10StartIndex(pureIsbn.length);

  if (targetLength === ISBN_13_LENGTH) {
    parts.push(getIsbn13Prefix(pureIsbn, isbn10StartIndex));
  }

  parts.push(getRegionGroupCode(pureIsbn, isbn10StartIndex));

  const publisherCodeEndIndex = calculatePublisherCodeEndPosition(pureIsbn, isbn10StartIndex);
  parts.push(getPublisherCode(pureIsbn, isbn10StartIndex, publisherCodeEndIndex));
  parts.push(getBookCode(pureIsbn, publisherCodeEndIndex));

  return parts;
};

/**
 * ISBNにハイフンを付けて整形する
 */
export const getIsbnWithHyphen = (isbn: string, targetLength: 10 | 13): string => {
  const pureIsbn = removeHyphens(isbn);
  const parts = splitIsbnParts(pureIsbn, targetLength);
  const isbnWithoutCheckDigit = parts.join('');

  const checkDigit =
    targetLength === ISBN_10_LENGTH
      ? getIsbn10CheckDigit(isbnWithoutCheckDigit)
      : getIsbn13CheckDigit(isbnWithoutCheckDigit);

  parts.push(checkDigit);

  return parts.join('-');
};

/**
 * ISBN-10をISBN-13に変換する
 */
export const getIsbn13 = (isbn: string): Isbn13 => {
  const cleanIsbn = removeHyphens(isbn);

  if (cleanIsbn.length === ISBN_13_LENGTH) {
    return cleanIsbn as Isbn13;
  }

  const isbn10WithoutCheckDigit = cleanIsbn.slice(0, -1);
  const isbn13WithoutCheckDigit = `${DEFAULT_ISBN_13_PREFIX}${isbn10WithoutCheckDigit}`;
  const checkDigit = getIsbn13CheckDigit(isbn13WithoutCheckDigit);

  return `${isbn13WithoutCheckDigit}${checkDigit}` as Isbn13;
};

/**
 * ISBN-13をISBN-10に変換する
 */
export const getIsbn10 = (isbn: string): string => {
  const cleanIsbn = removeHyphens(isbn);

  if (cleanIsbn.length === ISBN_10_LENGTH) {
    return cleanIsbn;
  }

  const isbn10WithoutCheckDigit = cleanIsbn.slice(3, -1);
  const checkDigit = getIsbn10CheckDigit(isbn10WithoutCheckDigit);

  return `${isbn10WithoutCheckDigit}${checkDigit}`;
};
