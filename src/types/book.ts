// 書籍データの型定義
export interface BookData {
  isbn?: string | null;
  title?: string | null;
  subtitle?: string | null;
  author?: string | null;
  publisher?: string | null;
  pubdate?: string | null;
  cover?: string | null;
}