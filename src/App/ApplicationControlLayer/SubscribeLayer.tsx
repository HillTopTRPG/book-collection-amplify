import type { Schema } from '$/amplify/data/resource.ts';
import type { ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useRef } from 'react';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import {
  selectCreateFilterSet,
  setCollections,
  setCreateFilterSet,
  setFilterSets,
} from '@/store/subscriptionDataSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

type Props = {
  children: ReactNode;
};

export default function SubscribeLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  const createFilterSet = useAppSelector(selectCreateFilterSet);
  const nextFilterSetNameRef = useRef<string | null>(null);
  const { makeCollectionByDb, makeFilterSetByDb } = useAwsAccess();

  // FilterSet 新規作成処理
  useEffect(() => {
    if (createFilterSet && nextFilterSetNameRef.current !== createFilterSet.name) {
      nextFilterSetNameRef.current = createFilterSet.name;
      // 新規作成
      userPoolClient.models.FilterSet.create(createFilterSet);
    }
    dispatch(setCreateFilterSet(null));
  }, [dispatch, createFilterSet]);

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
