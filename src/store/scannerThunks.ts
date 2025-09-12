import { createAsyncThunk } from '@reduxjs/toolkit';

import { BookData } from '../types/book';
import { fetchGoogleBooksApi, fetchOpenBdApi, fetchRakutenBooksApi } from '../utils/fetch';

export const fetchBookDataThunk = createAsyncThunk<
  { isbn: string; data: BookData },
  string,
  { rejectValue: { isbn: string; errorMsg: string; } }
>(
  'scanner/fetchBookData',
  async (isbn, { rejectWithValue }) => {
    const openBdApiResult = await fetchOpenBdApi(isbn);
    const googleBooksApiResult = await fetchGoogleBooksApi(isbn);
    const rakutenBooksApiResult = await fetchRakutenBooksApi({ isbn });
    const result: { isbn: string; data: BookData } = { isbn, data: {
      isbn,
      title: rakutenBooksApiResult.at(0)?.title || googleBooksApiResult.title || openBdApiResult.title || '',
      subtitle: rakutenBooksApiResult.at(0)?.subtitle || googleBooksApiResult.subtitle || openBdApiResult.subtitle || '',
      author: rakutenBooksApiResult.at(0)?.author || googleBooksApiResult.author || openBdApiResult.author || '著者不明',
      publisher: rakutenBooksApiResult.at(0)?.publisher || googleBooksApiResult.publisher || openBdApiResult.publisher || '出版社不明',
      pubdate: rakutenBooksApiResult.at(0)?.pubdate || googleBooksApiResult.pubdate || openBdApiResult.pubdate || '出版日不明',
      cover: rakutenBooksApiResult.at(0)?.cover || googleBooksApiResult.cover || openBdApiResult.cover || '',
    } };

    if (!result.data.title) {
      const errorMsg = '書籍データ取得失敗';

      return rejectWithValue({ isbn, errorMsg });
    }

    return result;
  }
);