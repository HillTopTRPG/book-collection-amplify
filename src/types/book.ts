import type { IdInfo } from '@/types/system.ts';

export type Isbn13 = string & { readonly __brand: 'Isbn13' };

// 書籍データの型定義
export type BookData = {
  isbn: Isbn13;
  title?: string | null;
  volume?: string | null;
  volumeTitle?: string | null;
  creator?: string[];
  seriesTitle?: string | null;
  edition?: string | null;
  publisher?: string | null;
  date?: string | null;
  ndc?: string | null;
  ndcLabels: string[];
  cover?: string | null;
  extent?: string | null;
};

export type BookDetail = {
  book: BookData;
  collection: IdInfo;
};
