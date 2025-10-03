import { useLogs } from '@/hooks/useLogs.ts';
import FilterSetList from './FilterSetList.tsx';

export default function CollectionPage() {
  useLogs({ componentName: 'CollectionPage' });

  return (
    <div className="flex flex-col w-full flex-1 gap-1 p-3">
      <FilterSetList />
    </div>
  );
}
