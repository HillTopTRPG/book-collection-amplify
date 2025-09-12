import { ReactNode, useEffect, useRef } from 'react';

import { generateClient } from 'aws-amplify/data';

import { Schema } from '$/amplify/data/resource.ts';
import { setFilterSet } from '@/store/filterSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import {
  selectCreateFilterSet,
  setBooks,
  setCollections, setCreateFilterSet,
  setFilterSets,
} from '@/store/subscriptionDataSlice.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
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
      next: (data) => dispatch(setCollections([...data.items])),
    });
    const bookSubscription = apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => dispatch(setBooks([...data.items])),
    });
    const filterSetSubscription = userPoolClient.models.FilterSet.observeQuery().subscribe({
      next: (data) => {
        dispatch(setFilterSets([...data.items]));
        if (nextFilterSetNameRef.current) {
          const item = [...data.items].reverse().find(item => item.name === nextFilterSetNameRef.current);
          if (item) {
            dispatch(setFilterSet({ id: item.id, filterSet: JSON.parse(item.filters) }));
          }
          nextFilterSetNameRef.current = null;
        }
      },
    });
    return () => {
      collectionSubscription.unsubscribe();
      bookSubscription.unsubscribe();
      filterSetSubscription.unsubscribe();
    };
  }, [dispatch]);

  return children;
}
