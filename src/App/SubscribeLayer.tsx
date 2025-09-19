import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { setFilterSet } from '@/store/editFilterSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import {
  selectCreateFilterSet,
  setCollections,
  setCreateFilterSet,
  setFilterSets,
} from '@/store/subscriptionDataSlice.ts';
import type { Schema } from '$/amplify/data/resource.ts';

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
        dispatch(
          setCollections(
            structuredClone(data.items).map(item => ({
              ...item,
              meta: JSON.parse(item.meta?.trim() || '{}'),
            }))
          )
        );
      },
    });
    const filterSetSubscription = userPoolClient.models.FilterSet.observeQuery().subscribe({
      next: data => {
        dispatch(
          setFilterSets(
            structuredClone(data.items).map(item => ({
              ...item,
              fetch: JSON.parse(item.fetch?.trim() || '{}') as FilterSet['fetch'],
              filters: JSON.parse(item.filters?.trim() || '[]') as FilterSet['filters'],
            }))
          )
        );
        if (nextFilterSetNameRef.current) {
          // Use slice().reverse() to avoid mutating original array
          const item = data.items
            .slice()
            .reverse()
            .find(item => item.name === nextFilterSetNameRef.current);
          if (item) {
            dispatch(setFilterSet({ id: item.id, filters: JSON.parse(item.filters) }));
          }
          nextFilterSetNameRef.current = null;
        }
      },
    });

    return () => {
      collectionSubscription.unsubscribe();
      filterSetSubscription.unsubscribe();
    };
  }, [dispatch]);

  return children;
}
