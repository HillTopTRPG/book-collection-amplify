
// openBD APIから書籍データを取得
import {BookData} from '../types/book.ts';

export async function fetchOpenBdApi(isbn: string): Promise<BookData> {
  try {
    const response = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    const data = await response.json();

    if (!data || !data[0] || !data[0].summary) {
      return { isbn };
    }

    const book = data[0].summary;

    return {
      isbn,
      title: book.title || null,
      subtitle: book.subtitle || null,
      author: book.author || null,
      publisher: book.publisher || null,
      pubdate: book.pubdate || null,
      cover: book.cover || null
    };
  } catch (error) {
    console.error('openBD API エラー:', error);
    return { isbn };
  }
}

export async function fetchGoogleBooksApi(isbn: string): Promise<BookData> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();

    if (!data?.items || !data.items[0]) {
      return { isbn };
    }
    return {
      isbn,
      title: data.items[0].volumeInfo?.title || null,
      subtitle: data.items[0].volumeInfo?.subtitle || null,
      author: data.items[0].volumeInfo?.authors.join(',') || null,
      publisher: data.items[0].volumeInfo?.publisher || null,
      pubdate: data.items[0].volumeInfo?.publishedDate || null,
      cover: data.items[0].volumeInfo?.imageLinks?.thumbnail ?? null,
    };
  } catch (error) {
    console.error('Google Books API エラー:', error);
    return { isbn };
  }
}
