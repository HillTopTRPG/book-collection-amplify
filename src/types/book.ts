// 書籍データの型定義
export interface BookData {
  isbn: string;
  title?: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  cover?: string;
  error?: string;
}