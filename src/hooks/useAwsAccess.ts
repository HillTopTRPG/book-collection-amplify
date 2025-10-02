import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { Collection, FilterAndGroup, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import { generateClient } from 'aws-amplify/data';
import { omit } from 'es-toolkit/compat';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import {
  addUpdatingCollectionIsbnList,
  BookStatusEnum,
  isBookStatus,
  selectAllFilterSets,
} from '@/store/subscriptionDataSlice.ts';
import { wait } from '@/utils/primitive.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export const useAwsAccess = () => {
  const dispatch = useAppDispatch();
  const allFilterSets = useAppSelector(selectAllFilterSets);

  const makeCollectionByDb = useCallback((db: Schema['Collection']['type']): Collection => {
    const isbn = db.isbn as Isbn13;
    const status = db.status;

    return {
      ...db,
      isbn,
      status: isBookStatus(status) ? status : BookStatusEnum.Unregistered,
    } as const satisfies Collection;
  }, []);

  const makeCreateCollection = useCallback(
    (collection: { isbn: Isbn13; status: Collection['status'] }): Schema['Collection']['createType'] => ({
      ...collection,
    }),
    []
  );

  const makeCreateFilterSet = useCallback(
    (filterSet: {
      name: string;
      fetch: NdlFullOptions;
      filters: FilterAndGroup[];
      collectionId: string;
    }): Schema['FilterSet']['createType'] => ({
      ...filterSet,
      fetch: JSON.stringify(filterSet.fetch),
      filters: JSON.stringify(filterSet.filters),
    }),
    []
  );

  const makeUpdateCollection = (
    collection: Partial<Omit<Collection, 'isbn' | 'createdAt' | 'updatedAt' | 'owner'>> & { id: string }
  ): Schema['Collection']['updateType'] => ({
    ...collection,
  });

  const makeFilterSetByDb = useCallback(
    (db: Schema['FilterSet']['type']): FilterSet => ({
      ...db,
      fetch: JSON.parse(db.fetch.trim() || '{}') as NdlFullOptions,
      filters: JSON.parse(db.filters.trim() || '[]') as FilterAndGroup[],
    }),
    []
  );

  const createCollections = useCallback(
    async (props: Parameters<typeof makeCreateCollection>[0]): Promise<Collection | null> => {
      dispatch(addUpdatingCollectionIsbnList([props.isbn]));
      await wait(10);

      const { errors, data } = await userPoolClient.models.Collection.create(makeCreateCollection(props));
      if (data) return makeCollectionByDb(data);
      if (errors) console.error('Error create collection', errors);
      return null;
    },
    [dispatch, makeCollectionByDb, makeCreateCollection]
  );

  const createFilterSet = useCallback(
    async (props: Parameters<typeof makeCreateFilterSet>[0]): Promise<FilterSet | null> => {
      const { errors, data } = await userPoolClient.models.FilterSet.create(makeCreateFilterSet(props));
      if (data) return makeFilterSetByDb(data);
      if (errors) console.error('Error create filterSet', errors);
      return null;
    },
    [makeFilterSetByDb, makeCreateFilterSet]
  );

  const updateCollections = useCallback(
    async (collection: Parameters<typeof makeUpdateCollection>[0] & { isbn: Isbn13 }): Promise<Collection | null> => {
      dispatch(addUpdatingCollectionIsbnList([collection.isbn]));
      await wait(10);

      const { errors, data } = await userPoolClient.models.Collection.update(
        makeUpdateCollection(omit(collection, 'isbn'))
      );
      if (data) return makeCollectionByDb(data);
      if (errors) console.error('Error update collection', errors);
      return null;
    },
    [dispatch, makeCollectionByDb]
  );

  const deleteCollections = useCallback(
    async (collection: { id: string; isbn: Isbn13 }): Promise<Collection | null> => {
      // フィルターセットから参照されていたら削除しない
      if (allFilterSets.some(({ collectionId }) => collectionId === collection.id)) return null;

      dispatch(addUpdatingCollectionIsbnList([collection.isbn]));
      await wait(10);

      const { errors, data } = await userPoolClient.models.Collection.delete({ id: collection.id });
      if (data) return makeCollectionByDb(data);
      if (errors) console.error('Error delete collection', errors);
      return null;
    },
    [allFilterSets, dispatch, makeCollectionByDb]
  );

  return {
    makeCollectionByDb,
    makeFilterSetByDb,
    createCollections,
    updateCollections,
    deleteCollections,
    createFilterSet,
  };
};
