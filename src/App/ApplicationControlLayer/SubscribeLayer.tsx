import type { Schema } from '$/amplify/data/resource.ts';
import { generateClient } from 'aws-amplify/data';
import { useEffect } from 'react';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { setCollections, setFilterSets } from '@/store/subscriptionDataSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

/**
 * GraphQLサブスクリプションを管理するコンポーネント
 * AuthEventListenerによってuserIdをkeyとして再マウントされる
 */
export default function SubscribeLayer() {
  const dispatch = useAppDispatch();
  const { makeCollectionByDb, makeFilterSetByDb } = useAwsAccess();

  useEffect(() => {
    console.log('🔄 SubscribeLayer: Setting up subscriptions');

    const collectionSubscription = userPoolClient.models.Collection.observeQuery().subscribe({
      next: data => {
        console.log('📦 Collection data received:', data.items.length, 'items');
        dispatch(setCollections(structuredClone(data.items).map(makeCollectionByDb)));
      },
    });
    const filterSetSubscription = userPoolClient.models.FilterSet.observeQuery().subscribe({
      next: data => {
        console.log('🔍 FilterSet data received:', data.items.length, 'items');
        dispatch(setFilterSets(structuredClone(data.items).map(makeFilterSetByDb)));
      },
    });

    return () => {
      console.log('🚫 SubscribeLayer: Unsubscribing');
      collectionSubscription.unsubscribe();
      filterSetSubscription.unsubscribe();
    };
  }, [dispatch, makeCollectionByDb, makeFilterSetByDb]);

  // このコンポーネントはUIを持たない
  return null;
}
