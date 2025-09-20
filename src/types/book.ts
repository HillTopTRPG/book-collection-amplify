// 書籍データの型定義
import type { Isbn13 } from '@/store/scannerSlice.ts';

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
