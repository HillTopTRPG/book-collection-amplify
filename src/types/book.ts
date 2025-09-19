// 書籍データの型定義
export type BookData = {
  isbn: string;
  title?: string | null;
  volume?: string | null;
  volumeTitle?: string | null;
  creator?: string[];
  seriesTitle?: string | null;
  edition?: string | null;
  publisher?: string | null;
  date?: string | null;
  ndc?: string | null;
  ndcLabel?: string | null;
  cover?: string | null;
  extent?: string | null;
};
