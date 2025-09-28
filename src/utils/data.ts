import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { filterMatch } from '@/utils/primitive.ts';
import type { PickRequired } from '@/utils/type.ts';

export const getScannedItemMapValueByBookData = (collections: Collection[], book: BookData): ScannedItemMapValue => {
  const isbn = book.isbn;
  const result: PickRequired<ScannedItemMapValue, 'bookDetail'> = {
    isbn,
    status: 'loading',
    collectionId: null,
    bookDetail: { book, isHave: false, isWant: false },
    filterSets: [],
  };
  const collection = collections.find(filterMatch({ isbn }));
  if (collection) {
    result.bookDetail.book = { ...book, ...collection.meta.overwrite };
    result.bookDetail.isHave = collection.meta.isHave ?? false;
    result.bookDetail.isWant = collection.meta.isWant ?? false;
  }
  return result;
};

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  const requestOptions: NdlFetchOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  return JSON.stringify(requestOptions);
};
