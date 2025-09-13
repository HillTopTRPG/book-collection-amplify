import { useState } from 'react';

import FilterUI from '@/components/FilterUI';

import CollectionsList from './CollectionsList';

export default function CollectionPage() {
  const [isAddSearch, setIsAddSearch] = useState(false);

  return (
    <div className="flex flex-col w-full flex-1 gap-2 p-3">
      <FilterUI {...{ isAddSearch, setIsAddSearch }} />
      <CollectionsList isAddSearch={isAddSearch} />
    </div>
  );
}