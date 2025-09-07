
// openBD APIから書籍データを取得
import {BookData} from '../types/book.ts'

export async function fetchBookData(isbn: string): Promise<BookData> {
  try {
    const response = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    const data = await response.json();

    if (!data || !data[0] || !data[0].summary) {
      return {
        isbn,
        error: "書籍情報が見つかりませんでした"
      };
    }

    const book = data[0].summary;

    return {
      isbn,
      title: book.title || "タイトル不明",
      author: book.author || "著者不明",
      publisher: book.publisher || "出版社不明",
      pubdate: book.pubdate || "",
      cover: book.cover || ""
    };
  } catch (error) {
    console.error('openBD API エラー:', error);
    return {
      isbn,
      error: "書籍情報の取得に失敗しました"
    };
  }
}
