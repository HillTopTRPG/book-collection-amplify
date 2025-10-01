import type { Schema } from '$/amplify/data/resource.ts';
import type { ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useEffect } from 'react';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { setCollections, setFilterSets } from '@/store/subscriptionDataSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

type Props = {
  children: ReactNode;
};

export default function SubscribeLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  const { makeCollectionByDb, makeFilterSetByDb } = useAwsAccess();

  useEffect(() => {
    const collectionSubscription = userPoolClient.models.Collection.observeQuery().subscribe({
      next: data => {
        dispatch(setCollections(structuredClone(data.items).map(makeCollectionByDb)));
      },
    });
    const filterSetSubscription = userPoolClient.models.FilterSet.observeQuery().subscribe({
      next: data => {
        dispatch(setFilterSets(structuredClone(data.items).map(makeFilterSetByDb)));
      },
    });

    return () => {
      collectionSubscription.unsubscribe();
      filterSetSubscription.unsubscribe();
    };
  }, [dispatch, makeCollectionByDb, makeFilterSetByDb]);

  return children;
}
