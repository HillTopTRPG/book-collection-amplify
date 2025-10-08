import { useLogs } from '@/hooks/useLogs.ts';
import CollectionFilter from '@/pages/CollectionPage/CollectionFilter.tsx';
import FilterSetList from './FilterSetList.tsx';

export default function CollectionPage() {
  useLogs({ componentName: 'CollectionPage' });

  return (
    <div className="flex flex-col w-full flex-1 gap-1 py-3">
      <CollectionFilter />
      <FilterSetList />
    </div>
  );
}
