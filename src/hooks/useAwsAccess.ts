import type { Collection } from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import { generateClient } from 'aws-amplify/data';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '@/store/hooks.ts';
import { setTraceTarget } from '@/store/subscriptionDataSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export const useAwsAccess = () => {
  const dispatch = useAppDispatch();
  const createCollections = (isbn: Isbn13, meta: Collection['meta']): string => {
    const traceId = uuidv4();
    dispatch(setTraceTarget({ traceId, type: 'create', collection: 'collections', target: traceId }));
    userPoolClient.models.Collection.create({
      isbn,
      meta: JSON.stringify(meta),
      traceId,
    });
    return traceId;
  };

  const updateCollections = (id: string, meta: Collection['meta']): string => {
    const traceId = uuidv4();
    dispatch(setTraceTarget({ traceId, type: 'update', collection: 'collections', target: id }));
    userPoolClient.models.Collection.update({
      id,
      meta: JSON.stringify(meta),
    });
    return traceId;
  };

  const deleteCollections = (id: string): string => {
    const traceId = uuidv4();
    dispatch(setTraceTarget({ traceId, type: 'delete', collection: 'collections', target: id }));
    userPoolClient.models.Collection.delete({ id });
    return traceId;
  };

  return {
    createCollections,
    updateCollections,
    deleteCollections,
  };
};
