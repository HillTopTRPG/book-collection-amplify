import CollectionsList from '../CollectionsList';
import CustomizedTabs from '@/CustomizedTabs.tsx';
import {Boxes, Building, Calendar, CaseUpper, UserPen} from 'lucide-react';
import SortButton from '@/components/SortButton.tsx';
import {useEffect, useState} from 'react';
import type {Schema} from '../../amplify/data/resource.ts';
import {generateClient} from 'aws-amplify/api';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

const apiKeyClient = generateClient<Schema>({
  authMode: 'apiKey'
});

export default function CollectionPage() {
  const [collections, setCollections] = useState<Array<Schema['Collection']['type']>>([]);
  const [books, setBooks] = useState<Array<Schema['Book']['type']>>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    userPoolClient.models.Collection.observeQuery().subscribe({
      next: (data) => setCollections([...data.items]),
    });
    apiKeyClient.models.Book.observeQuery().subscribe({
      next: (data) => setBooks([...data.items]),
    });
  }, []);

  return (
    <div className="flex flex-col w-full flex-1 gap-4 p-4 overflow-clip">
      <CustomizedTabs tabs={{
        title: CaseUpper,
        author: UserPen,
        publisher: Building,
        pubdate: Calendar,
        series: Boxes,
      }} tabExtends={<SortButton sortOrder={sortOrder} setSortOrder={setSortOrder} />}>
        {(tab) => (
          <CollectionsList books={books} collections={collections} tab={tab} sortOrder={sortOrder} />
        )}
      </CustomizedTabs>
    </div>
  );
}