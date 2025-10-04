import type { Collection, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { IdInfo } from '@/types/system.ts';
import { useAppSelector } from '@/store/hooks.ts';
import {
  selectCollections,
  selectFilterSets,
  selectTempCollections,
  selectTempFilterSets,
} from '@/store/subscriptionDataSlice.ts';
import { filterMatch } from '@/utils/primitive.ts';

export default function useIdInfo() {
  const filterSets = useAppSelector(selectFilterSets);
  const tempFilterSets = useAppSelector(selectTempFilterSets);
  const collections = useAppSelector(selectCollections);
  const tempCollections = useAppSelector(selectTempCollections);

  const getFilterSetByIdInfo = ({ type, id }: IdInfo): FilterSet | null =>
    type === 'db' ? (filterSets.find(filterMatch({ id })) ?? null) : (tempFilterSets.find(filterMatch({ id })) ?? null);

  const getCollectionByIdInfo = ({ type, id }: IdInfo): Collection =>
    type === 'db' ? collections.find(filterMatch({ id }))! : tempCollections.find(filterMatch({ id }))!;

  return {
    getFilterSetByIdInfo,
    getCollectionByIdInfo,
  };
}
