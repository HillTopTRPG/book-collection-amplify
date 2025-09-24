import type { BookData } from '@/types/book.ts';

export const isBookData = (book: BookData | string | null): book is BookData => {
  if (book === null) return false;
  return typeof book !== 'string';
};

export const getVolumeNumber = (book: BookData): number | null => {
  const str = (book.volume || book.volumeTitle || book.title || '')
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replaceAll(/[[\]()]/g, '')
    .trim();
  const maybeNumStr = [str.match(/^[0-9]+$/)?.at(0), str.match(/[0-9]+$/)?.at(0)].find(s => s !== undefined);
  if (maybeNumStr === undefined) return null;
  return parseInt(maybeNumStr, 10);
};

export const isNearDateBook = (b1: BookData, b2: BookData): boolean => {
  const r1 = b1.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  const r2 = b2.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  if (!r1 || !r2) return false;
  const d1 = new Date(parseInt(r1[0]), parseInt(r1[1]) - 1, r1[2] ? parseInt(r1[2]) : 15);
  const d2 = new Date(parseInt(r2[0]), parseInt(r2[1]) - 1, r2[2] ? parseInt(r2[2]) : 15);
  const dayDiff = Math.abs((d2.getTime() - d1.getTime()) / 86400000);

  return dayDiff < 50;
};
