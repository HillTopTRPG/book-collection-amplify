import {createAsyncThunk} from '@reduxjs/toolkit'
import {fetchGoogleBooksApi, fetchOpenBdApi} from '../utils/fetch'
import {BookData} from '../types/book'

export const fetchBookDataThunk = createAsyncThunk<
  { isbn: string; data: BookData },
  string,
  { rejectValue: { isbn: string; errorMsg: string; } }
>(
  'scanner/fetchBookData',
  async (isbn, { rejectWithValue }) => {
    const openBdApiResult = await fetchOpenBdApi(isbn);
    const googleBooksApiResult = await fetchGoogleBooksApi(isbn);
    const result: { isbn: string; data: BookData } = { isbn, data: {
      isbn,
      title: googleBooksApiResult.title || openBdApiResult.title || '',
      subtitle: googleBooksApiResult.subtitle || openBdApiResult.subtitle || '',
      author: googleBooksApiResult.author || openBdApiResult.author || '著者不明',
      publisher: googleBooksApiResult.publisher || openBdApiResult.publisher || '出版社不明',
      pubdate: googleBooksApiResult.pubdate || openBdApiResult.pubdate || '出版日不明',
      cover: googleBooksApiResult.cover || openBdApiResult.cover || '',
    } };

    if (!result.data.title) {
      const errorMsg = '書籍データ取得失敗';
      return rejectWithValue({ isbn, errorMsg });
    }

    return result;
  }
);