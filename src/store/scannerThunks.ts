import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchBookData } from '../utils/fetch';
import { BookData } from '../types/book';

export const fetchBookDataThunk = createAsyncThunk<
  { isbn: string; data: BookData },
  string,
  { rejectValue: { isbn: string; errorMsg: string; } }
>(
  'scanner/fetchBookData',
  async (isbn, { rejectWithValue }) => {
    try {
      const data = await fetchBookData(isbn);
      return { isbn, data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return rejectWithValue({ isbn, errorMsg });
    }
  }
);