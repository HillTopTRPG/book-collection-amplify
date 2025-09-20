import type { MutableRefObject, ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import {
  addFilterQueue,
  addGetImageQueue,
  completeFilterQueues,
  completeGetImageQueues,
  selectQueuedBookImageIsbn,
  selectQueuedFilterOption,
} from '@/store/fetchApiQueueSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { Isbn13 } from '@/store/scannerSlice.ts';
import { selectScanningItemMap } from '@/store/scannerSlice.ts';
import { selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlOptions } from '@/utils/fetch.ts';
import { fetchNdlSearch, getBookImageUrl } from '@/utils/fetch.ts';
import { wait } from '@/utils/primitive.ts';

const getBookImageQueueProcess = async (
  queuedBookImageIsbn: Isbn13[],
  lastEndTime: MutableRefObject<number>,
  bookImageLastResult: MutableRefObject<{ type: 'ndl' | 'other'; url: string | null | undefined } | null>
) => {
  if (!queuedBookImageIsbn.length) return { list: [], retryList: [] };
  const needWait = Math.ceil(10 - (performance.now() - lastEndTime.current));
  if (bookImageLastResult.current?.type !== 'ndl' && needWait > 0) {
    await wait(needWait);
  }

  const retryList: Isbn13[] = [];

  const list = await Promise.all(
    queuedBookImageIsbn.map(
      isbn =>
        new Promise<{ isbn: Isbn13; url: string | null }>(resolve => {
          getBookImageUrl(isbn)
            .then(({ url, error }) => {
              const isRetry = error === 'need-retry';
              if (isRetry) retryList.push(isbn);
              resolve({ isbn, url: isRetry ? 'retrying' : url });
            })
            .catch(() => {
              resolve({ isbn, url: null });
            });
        })
    )
  );
  lastEndTime.current = performance.now();
  const url = list.at(0)?.url;
  bookImageLastResult.current = {
    type: url?.includes('ndlsearch') ? 'ndl' : 'other',
    url,
  };

  return { list, retryList };
};

type Props = {
  children: ReactNode;
};

export default function QueueProcessLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  const queuedBookImageIsbn = useAppSelector(selectQueuedBookImageIsbn);
  const lastEndTime = useRef(0);
  const bookImageLastResult = useRef<{
    type: 'ndl' | 'other';
    url: string | null | undefined;
  } | null>(null);
  const queuedFilterOption = useAppSelector(selectQueuedFilterOption);
  const filterSets = useAppSelector(selectFilterSets);
  const scanningItemMap = useAppSelector(selectScanningItemMap);

  // 書影URL取得キューの処理
  useEffect(() => {
    getBookImageQueueProcess(queuedBookImageIsbn, lastEndTime, bookImageLastResult).then(({ list, retryList }) => {
      dispatch(completeGetImageQueues(list));
      if (retryList.length) {
        setTimeout(() => {
          dispatch(addGetImageQueue({ isbnList: retryList, type: 'retry' }));
        }, 10000);
      }
    });
  }, [dispatch, queuedBookImageIsbn]);

  // 蔵書のグループ本を全て検索する
  useEffect(() => {
    filterSets.forEach(filterSet => {
      dispatch(addFilterQueue({ options: [JSON.stringify(filterSet.fetch)], type: 'priority' }));
    });
  }, [dispatch, filterSets]);

  // 読み込み書籍のグループ本のフィルターが変更される毎に検索結果を取得し直す
  useEffect(() => {
    console.log('scanningItemMapが更新された！');
    Array.from(scanningItemMap.entries()).forEach(([_, scanningItemMapValue]) => {
      const option = scanningItemMapValue.filterSets.at(0)?.fetch;
      if (!option) return;
      dispatch(addFilterQueue({ options: [JSON.stringify(option)], type: 'priority' }));
    });
  }, [dispatch, scanningItemMap]);

  // グループ本検索キューの処理
  useEffect(() => {
    if (!queuedFilterOption.length) return;
    Promise.all(
      queuedFilterOption.map(
        optionsStr =>
          new Promise<{ option: string; books: BookData[] }>(resolve => {
            const options = JSON.parse(optionsStr) as NdlFullOptions;
            const requestOptions: NdlOptions = {
              title: options.title,
              creator: options.useCreator ? options.creator : undefined,
              publisher: options.usePublisher ? options.publisher : undefined,
            };
            fetchNdlSearch(requestOptions).then(books => {
              dispatch(addGetImageQueue({ isbnList: books.map(({ isbn }) => isbn), type: 'new' }));
              resolve({ option: optionsStr, books });
            });
          })
      )
    ).then(list => {
      console.log('fetchNdlSearch done', list);
      dispatch(completeFilterQueues(list));
    });
  }, [dispatch, queuedFilterOption]);

  return children;
}
