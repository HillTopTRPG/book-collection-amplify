import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { Collection, FilterAndGroup, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import { generateClient } from 'aws-amplify/data';
import { omit } from 'es-toolkit/compat';
import { useAppDispatch } from '@/store/hooks.ts';
import { addUpdatingCollectionIsbnList, BookStatusEnum, isBookStatus } from '@/store/subscriptionDataSlice.ts';
import { wait } from '@/utils/primitive.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export const useAwsAccess = () => {
  const dispatch = useAppDispatch();
  const makeCollectionByDb = (db: Schema['Collection']['type']): Collection => {
    const isbn = db.isbn as Isbn13;
    const status = db.status;

    return {
      ...db,
      isbn,
      status: isBookStatus(status) ? status : BookStatusEnum.Unregistered,
    } as const satisfies Collection;
  };
  const makeCreateCollection = (collection: {
    isbn: Isbn13;
    status: Collection['status'];
  }): Schema['Collection']['createType'] => ({
    ...collection,
  });
  const makeUpdateCollection = (
    collection: Partial<Omit<Collection, 'isbn' | 'createdAt' | 'updatedAt' | 'owner'>> & { id: string }
  ): Schema['Collection']['updateType'] => ({
    ...collection,
  });
  const makeFilterSetByDb = (db: Schema['FilterSet']['type']): FilterSet => ({
    ...db,
    fetch: JSON.parse(db.fetch.trim() || '{}') as NdlFullOptions,
    filters: JSON.parse(db.filters.trim() || '[]') as FilterAndGroup[],
  });
  const createCollections = async (props: Parameters<typeof makeCreateCollection>[0]): Promise<Collection | null> => {
    dispatch(addUpdatingCollectionIsbnList([props.isbn]));

    await wait(10);

    const { errors, data } = await userPoolClient.models.Collection.create(makeCreateCollection(props));

    if (data) {
      return makeCollectionByDb(data);
    }

    if (errors) {
      console.error('Error create collection', errors);
    }

    return null;
  };

  const updateCollections = async (
    collection: Parameters<typeof makeUpdateCollection>[0] & { isbn: Isbn13 }
  ): Promise<Collection | null> => {
    dispatch(addUpdatingCollectionIsbnList([collection.isbn]));
    await wait(10);

    const { errors, data } = await userPoolClient.models.Collection.update(
      makeUpdateCollection(omit(collection, 'isbn'))
    );

    if (data) {
      console.log(data);
      return makeCollectionByDb(data);
    }

    if (errors) {
      console.error('Error update collection', errors);
    }
    return null;
  };

  const deleteCollections = async (collection: { id: string; isbn: Isbn13 }): Promise<Collection | null> => {
    dispatch(addUpdatingCollectionIsbnList([collection.isbn]));
    await wait(10);

    const { errors, data } = await userPoolClient.models.Collection.delete({ id: collection.id });

    console.log(data, errors);

    if (data) {
      return makeCollectionByDb(data);
    }

    if (errors) {
      console.error('Error delete collection', errors);
    }
    return null;
  };

  return {
    makeCollectionByDb,
    makeFilterSetByDb,
    createCollections,
    updateCollections,
    deleteCollections,
  };
};
