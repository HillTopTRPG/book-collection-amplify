import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { Collection, FilterAndGroup, FilterSet } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import { generateClient } from 'aws-amplify/data';
import { omit } from 'es-toolkit/compat';
import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks.ts';
import { addUpdatingCollectionApiIdList } from '@/store/subscriptionDataSlice.ts';
import { BookStatusEnum, isBookStatus } from '@/types/book.ts';
import { wait } from '@/utils/primitive.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export const useAwsAccess = () => {
  const dispatch = useAppDispatch();

  const makeCollectionByDb = useCallback((db: Schema['Collection']['type']): Collection => {
    const status = db.status;

    return {
      ...db,
      status: isBookStatus(status) ? status : BookStatusEnum.Unregistered,
    } as const satisfies Collection;
  }, []);

  const makeCreateCollection = useCallback(
    (collection: { apiId: string; status: Collection['status'] }): Schema['Collection']['createType'] => ({
      ...collection,
    }),
    []
  );

  const makeCreateFilterSet = useCallback(
    (filterSet: {
      apiId: string;
      name: string;
      fetch: NdlFullOptions;
      filters: FilterAndGroup[];
    }): Schema['FilterSet']['createType'] => ({
      ...filterSet,
      fetch: JSON.stringify(filterSet.fetch),
      filters: JSON.stringify(filterSet.filters),
    }),
    []
  );

  const makeUpdateCollection = (
    collection: Partial<Omit<Collection, 'createdAt' | 'updatedAt' | 'owner'>> & { id: string }
  ): Schema['Collection']['updateType'] => ({
    ...collection,
  });

  const makeUpdateFilterSet = (
    filterSet: Partial<Omit<FilterSet, 'createdAt' | 'updatedAt' | 'owner'>> & { id: string }
  ): Schema['FilterSet']['updateType'] => ({
    ...filterSet,
    fetch: JSON.stringify(filterSet.fetch),
    filters: JSON.stringify(filterSet.filters),
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
      dispatch(addUpdatingCollectionApiIdList([props.apiId]));
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
    async (collection: Parameters<typeof makeUpdateCollection>[0] & { apiId: string }): Promise<Collection | null> => {
      dispatch(addUpdatingCollectionApiIdList([collection.apiId]));
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

  const updateFilterSet = useCallback(
    async (filterSet: Parameters<typeof makeUpdateFilterSet>[0]): Promise<FilterSet | null> => {
      const { errors, data } = await userPoolClient.models.FilterSet.update(
        makeUpdateFilterSet(omit(filterSet, 'isbn'))
      );
      if (data) return makeFilterSetByDb(data);
      if (errors) console.error('Error update filterSet', errors);
      return null;
    },
    [makeFilterSetByDb]
  );

  const deleteCollections = useCallback(
    async (collection: { id: string; apiId: string }): Promise<Collection | null> => {
      dispatch(addUpdatingCollectionApiIdList([collection.apiId]));
      await wait(10);

      const { errors, data } = await userPoolClient.models.Collection.delete({ id: collection.id });
      if (data) return makeCollectionByDb(data);
      if (errors) console.error('Error delete collection', errors);
      return null;
    },
    [dispatch, makeCollectionByDb]
  );

  const deleteFilterSet = useCallback(
    async (filterSet: { id: string }): Promise<FilterSet | null> => {
      const { errors, data } = await userPoolClient.models.FilterSet.delete(filterSet);
      if (data) return makeFilterSetByDb(data);
      if (errors) console.error('Error delete collection', errors);
      return null;
    },
    [makeFilterSetByDb]
  );

  return {
    makeCollectionByDb,
    makeFilterSetByDb,
    createCollections,
    updateCollections,
    deleteCollections,
    createFilterSet,
    updateFilterSet,
    deleteFilterSet,
  };
};
