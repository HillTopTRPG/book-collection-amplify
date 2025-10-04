import type { BookStatus } from '@/types/book.ts';
import { useState } from 'react';
import BookStatusChecks from '@/components/BookStatusChecks';

export default function CollectionFilter() {
  const [statusList, setStatusList] = useState<BookStatus[]>(['Unregistered', 'NotBuy', 'Hold', 'Planned', 'Owned']);

  const handleStatusListUpdate = (type: 'delete' | 'add', status: BookStatus) => {
    if (type === 'add') {
      setStatusList(prev => [...prev, status]);
    } else {
      setStatusList(prev => prev.filter(status => status !== status));
    }
  };

  // const statusList = useMemo(() => getKeys(BookStatusEnum).filter(status => statusFlg[status]), [statusFlg]);

  // const filterResultsByBookStatus = useAppSelector(state => selectFilterResultsByBookStatus(state, statusList));

  return (
    <>
      <div className="flex gap-x-2 gap-y-1 bg-background py-1 px-1 flex-wrap">
        <BookStatusChecks statusList={statusList} onUpdate={handleStatusListUpdate} />
      </div>
    </>
  );
}
