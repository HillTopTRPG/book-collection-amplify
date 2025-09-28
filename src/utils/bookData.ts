import type { BookData } from '@/types/book.ts';
import { FULLWIDTH_TO_HALF_WIDTH_OFFSET, MILLISECONDS_PER_DAY } from '@/constant/system.ts';

/**
 * 日付差分の判定基準（日数）
 */
const NEAR_DATE_THRESHOLD_DAYS = 50;

/**
 * 月の中旬を表すデフォルト日付
 */
const DEFAULT_DAY_OF_MONTH = 15;

/**
 * 変数がBookData型かどうかを判定する型ガード関数
 */
export const isBookData = (book: BookData | string | null): book is BookData => {
  if (book === null) return false;
  return typeof book !== 'string';
};

/**
 * 全角数字を半角数字に変換する
 */
const convertFullwidthToHalfWidth = (text: string): string =>
  text.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_TO_HALF_WIDTH_OFFSET));

/**
 * 括弧文字を除去する
 */
const removeBrackets = (text: string): string => text.replaceAll(/[[\]()]/g, '');

/**
 * 書籍情報から巻数抽出用の文字列を取得する
 */
const getVolumeSourceText = (book: BookData): string => (book.volume || book.volumeTitle || '').trim();

/**
 * 文字列を正規化する（全角数字変換、括弧除去、トリム）
 */
const normalizeTextForVolumeExtraction = (text: string): string =>
  removeBrackets(convertFullwidthToHalfWidth(text)).trim();

/**
 * 文字列から数字を抽出する
 */
const extractNumberFromText = (text: string): string | undefined => {
  // 完全一致
  const exactMatch = text.match(/^[0-9]+$/)?.at(0);
  // 末端一致
  const endMatch = text.match(/[0-9]+/)?.at(0);

  return [exactMatch, endMatch].find(match => match !== undefined);
};

/**
 * 書籍情報から巻数を抽出する
 */
export const getVolumeNumber = (book: BookData): number | null => {
  const sourceText = getVolumeSourceText(book);
  const normalizedText = normalizeTextForVolumeExtraction(sourceText);
  const numberString = extractNumberFromText(normalizedText);

  const volume = numberString ? parseInt(numberString, 10) : null;

  // console.log('volume', volume, book.volume, book.volumeTitle, book.title);

  return volume;
};

/**
 * 日付文字列の正規表現（YYYY.MM.DD または YYYY.MM 形式）
 */
const DATE_REGEX = /([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/;

/**
 * 日付文字列から年、月、日の配列を抽出する
 */
const parseDateString = (dateString: string | null | undefined): [string, string, string?] | null => {
  if (!dateString) return null;

  const matches = dateString.match(DATE_REGEX)?.slice(1);

  return matches as [string, string, string?] | null;
};

/**
 * 日付要素をDateオブジェクトに変換する
 */
const createDateFromComponents = (year: string, month: string, day?: string): Date => {
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10) - 1; // Dateオブジェクトの月は0ベース
  const dayNum = day ? parseInt(day, 10) : DEFAULT_DAY_OF_MONTH;

  return new Date(yearNum, monthNum, dayNum);
};

/**
 * 2つの日付間の日数差を計算する
 */
const calculateDaysDifference = (date1: Date, date2: Date): number => {
  const timeDifference = Math.abs(date2.getTime() - date1.getTime());

  return timeDifference / MILLISECONDS_PER_DAY;
};

/**
 * 2つの書籍の出版日が近いかどうかを判定する
 */
export const isNearDateBook = (book1: BookData, book2: BookData): boolean => {
  const dateComponents1 = parseDateString(book1.date);
  const dateComponents2 = parseDateString(book2.date);

  if (!dateComponents1 || !dateComponents2) return false;

  const date1 = createDateFromComponents(...dateComponents1);
  const date2 = createDateFromComponents(...dateComponents2);

  const daysDifference = calculateDaysDifference(date1, date2);

  return daysDifference < NEAR_DATE_THRESHOLD_DAYS;
};
