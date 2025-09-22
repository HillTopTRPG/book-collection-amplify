import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/FilterSets/NdlOptionsForm.tsx';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { FilterBean } from '@/store/subscriptionDataSlice.ts';
import {
  selectCreateFilterSet,
  setCollections,
  setCreateFilterSet,
  setFilterSets,
} from '@/store/subscriptionDataSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import { getIsbn13 } from '@/utils/primitive.ts';
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
              isbn: item.isbn as Isbn13,
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
              fetch: JSON.parse(item.fetch?.trim() || '{}') as NdlFullOptions,
              filters: JSON.parse(item.filters?.trim() || '[]') as FilterBean[][],
              primary: getIsbn13(item.primary),
            }))
          )
        );
      },
    });

    return () => {
      collectionSubscription.unsubscribe();
      filterSetSubscription.unsubscribe();
    };
  }, [dispatch]);

  return children;
}
