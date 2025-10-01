import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import type { IdInfo } from '@/types/system.ts';
import { v4 as uuidv4 } from 'uuid';
import { filterMatch } from '@/utils/primitive.ts';

export const getScannedItemMapValueByBookData = (
  book: BookData,
  dbCollections: Collection[],
  tempCollections: Collection[],
  dbFilterSets: FilterSet[],
  allNdlSearchResults: Record<string, BookData[]>
): { scannedItemMapValue: ScannedItemMapValue; tempCollection: Collection | null } => {
  const isbn = book.isbn;
  const collection = dbCollections.find(filterMatch({ isbn }));
  const tempCollection: Collection = tempCollections.find(filterMatch({ isbn })) ?? {
    id: uuidv4(),
    isbn,
    status: 'Unregistered',
    createdAt: '',
    updatedAt: '',
    owner: '',
  };
  // const tempFilterSet: FilterSet = {
  //   id: uuidv4(),
  //   name: book.title ?? '無名のフィルター',
  //   fetch: {
  //     title: book.title ?? '無名',
  //     publisher: book.publisher ?? '',
  //     creator: book.creator?.at(0) ?? '',
  //     usePublisher: true,
  //     useCreator: true,
  //   },
  //   filters: [{ list: [{ keyword: '', sign: '*=' }], grouping: 'date' }],
  //   createdAt: '',
  //   updatedAt: '',
  //   owner: '',
  // };
  const filterSets: IdInfo[] = dbFilterSets.flatMap(filterSet => {
    const key = JSON.stringify(filterSet.fetch);
    const result = key in allNdlSearchResults ? allNdlSearchResults[key] : [];

    return result.some(filterMatch({ isbn })) ? [{ type: 'db', id: filterSet.id }] : [];
  });

  const scannedItemMapValue: ScannedItemMapValue = {
    isbn,
    bookDetail: {
      book,
      collection: {
        type: collection ? 'db' : 'temp',
        id: collection ? collection.id : tempCollection.id,
      },
    },
    filterSets,
  };

  return {
    scannedItemMapValue,
    tempCollection: collection ? null : tempCollection,
  };
};

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  const requestOptions: NdlFetchOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  return JSON.stringify(requestOptions);
};
