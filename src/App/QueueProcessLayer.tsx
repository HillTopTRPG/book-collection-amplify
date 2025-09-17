import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { completeGetImageQueues, selectQueuedBookImageIsbn } from '@/store/fetchApiQueueSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { getBookImageUrl } from '@/utils/fetch.ts';

type Props = {
  children: ReactNode;
};

export default function QueueProcessLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  // const [processingIsbnList, setProcessingIsbnList] = useState<string[]>([]);
  const queuedBookImageIsbn = useAppSelector(selectQueuedBookImageIsbn);

  // useEffect(() => {
  //   if (!queuedBookImageIsbn.length) return;
  //
  //   setProcessingIsbnList([
  //     ...processingIsbnList,
  //     ...queuedBookImageIsbn,
  //   ].filter((isbn, idx, self) => self.findIndex(s => s === isbn) === idx));
  // }, [processingIsbnList, queuedBookImageIsbn]);

  useEffect(() => {
    Promise.all(queuedBookImageIsbn.map(props => new Promise<{ isbn: string, url: string | null }>((resolve) => {
      getBookImageUrl(props).then((url) => {
        resolve({ isbn: props.isbn, url });
      });
    }))).then(list => {
      console.log('getBookImage done', JSON.stringify(list));
      dispatch(completeGetImageQueues(list));
    });
  }, [dispatch, queuedBookImageIsbn]);

  return children;
}
