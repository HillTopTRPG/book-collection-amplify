import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { BookData, Collection } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { v4 as uuidv4 } from 'uuid';
import { filterMatch } from '@/utils/primitive.ts';

export const getBookDataByBookData = (
  book: BookData,
  dbCollections: Collection[],
  tempCollections: Collection[]
): { scannedItemMapValue: BookData; tempCollection: Collection | null } => {
  const { apiId } = book;
  const collection = dbCollections.find(filterMatch({ apiId }));
  const tempCollection: Collection = tempCollections.find(filterMatch({ apiId })) ?? {
    id: uuidv4(),
    apiId,
    status: 'Unregistered',
    createdAt: '',
    updatedAt: '',
    owner: '',
  };
  const scannedItemMapValue: BookData = book;

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
