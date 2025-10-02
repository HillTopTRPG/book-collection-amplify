import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
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

// NdlFullOptionsのキャッシュ（計算コスト削減）
const ndlOptionsStringCache = new WeakMap<NdlFullOptions, string>();

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  // キャッシュがあればそれを返す
  const cached = ndlOptionsStringCache.get(ndlFullOptions);
  if (cached !== undefined) {
    return cached;
  }

  const requestOptions: NdlFetchOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  const result = JSON.stringify(requestOptions);
  ndlOptionsStringCache.set(ndlFullOptions, result);
  return result;
};
