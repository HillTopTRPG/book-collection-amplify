import type { ReactNode } from 'react';
import { useEffect } from 'react';

import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import {
  addFilterQueue,
  completeFilterQueues,
  completeGetImageQueues,
  selectQueuedBookImageIsbn,
  selectQueuedFilterOption
} from '@/store/fetchApiQueueSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectScanningItemMap } from '@/store/scannerSlice.ts';
import { selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlOptions } from '@/utils/fetch.ts';
import { fetchNdlSearch, getBookImageUrl } from '@/utils/fetch.ts';

type Props = {
  children: ReactNode;
};

export default function QueueProcessLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  const queuedBookImageIsbn = useAppSelector(selectQueuedBookImageIsbn);
  const queuedFilterOption = useAppSelector(selectQueuedFilterOption);
  const filterSets = useAppSelector(selectFilterSets);
  const scanningItemMap = useAppSelector(selectScanningItemMap);

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

  useEffect(() => {
    filterSets.forEach(filterSet => {
      dispatch(addFilterQueue(JSON.stringify(filterSet)));
    });
  }, [dispatch, filterSets]);

  useEffect(() => {
    console.log('scanningItemMapが更新された！');
    console.log(JSON.stringify(scanningItemMap, null, 2));
    Array.from(scanningItemMap.entries()).forEach(([_, scanningItemMapValue]) => {
      const options = scanningItemMapValue.filterSets.at(0)?.fetch;
      if (!options) return;
      dispatch(addFilterQueue(JSON.stringify(options)));
    });
  }, [dispatch, scanningItemMap]);

  useEffect(() => {
    Promise.all(queuedFilterOption.map(optionsStr => new Promise<{ option: string, books: BookData[] }>((resolve) => {
      const options = JSON.parse(optionsStr) as NdlFullOptions;
      const requestOptions: NdlOptions = {
        title: options.title,
        creator: options.useCreator ? options.creator : undefined,
        publisher: options.usePublisher ? options.publisher : undefined,
      };
      fetchNdlSearch(requestOptions).then((books) => {
        resolve({ option: optionsStr, books });
      });
    }))).then(list => {
      console.log('fetchNdlSearch done', JSON.stringify(list, null, 2));
      dispatch(completeFilterQueues(list));
    });
  }, [dispatch, queuedFilterOption]);

  return children;
}
