import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { ScanFinishedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlOptions } from '@/utils/fetch.ts';
import { filterMatch } from '@/utils/primitive.ts';
import type { PickRequired } from '@/utils/type.ts';

export const getScannedItemMapValueByBookData = (
  collections: Collection[],
  book: BookData
): ScanFinishedItemMapValue => {
  const isbn = book.isbn;
  const result: PickRequired<ScanFinishedItemMapValue, 'bookDetail'> = {
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
  const requestOptions: NdlOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  return JSON.stringify(requestOptions);
};
