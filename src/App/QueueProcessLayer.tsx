import type { MutableRefObject, ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { enqueueBookImage, dequeueBookImage, selectFetchBookImageQueueTargets } from '@/store/fetchBookImageSlice.ts';
import {
  enqueueNdlSearch,
  dequeueNdlSearch,
  selectNdlSearchQueueTargets,
  selectNdlSearchQueueResults,
} from '@/store/fetchNdlSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import type { Isbn13, ScanFinishedItemMapValue } from '@/store/scannerSlice.ts';
import { selectSelectedScannedItemFetchOptions, dequeueScan, selectScanQueueTargets } from '@/store/scannerSlice.ts';
import { type FilterSet, selectCollections, selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import { getScannedItemMapValueByBookData, makeNdlOptionsStringByNdlFullOptions } from '@/utils/data.ts';
import type { NdlOptions } from '@/utils/fetch.ts';
import { fetchNdlSearch, getBookImageUrl } from '@/utils/fetch.ts';
import { wait } from '@/utils/primitive.ts';

const fetchBookImageQueueProcess = async (
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

  const collections = useAppSelector(selectCollections);
  const filterQueueResults = useAppSelector(selectNdlSearchQueueResults);

  // 書影URL取得キューの対象
  const fetchBookImageQueueTargets = useAppSelector(selectFetchBookImageQueueTargets);
  // スキャンキューの対象
  const scanQueueTargets = useAppSelector(selectScanQueueTargets);
  // NDL検索キューの対象
  const ndlSearchQueueTargets = useAppSelector(selectNdlSearchQueueTargets);

  // NDL検索キューの結果
  const ndlSearchQueueResults = useAppSelector(selectNdlSearchQueueResults);

  const lastEndTime = useRef(0);
  const bookImageLastResult = useRef<{
    type: 'ndl' | 'other';
    url: string | null | undefined;
  } | null>(null);
  const filterSets = useAppSelector(selectFilterSets);
  const selectedScannedItemFetchOptions = useAppSelector(selectSelectedScannedItemFetchOptions);

  // 書影URL取得キューの処理
  useEffect(() => {
    fetchBookImageQueueProcess(fetchBookImageQueueTargets, lastEndTime, bookImageLastResult).then(
      ({ list, retryList }) => {
        dispatch(dequeueBookImage(list));
        if (retryList.length) {
          setTimeout(() => {
            dispatch(enqueueBookImage({ isbnList: retryList, type: 'retry' }));
          }, 10000);
        }
      }
    );
  }, [dispatch, fetchBookImageQueueTargets]);

  // スキャンキューの処理1 - NDL検索キューへのenqueue
  useEffect(() => {
    dispatch(enqueueNdlSearch({ options: scanQueueTargets.map(isbn => JSON.stringify({ isbn })), type: 'priority' }));
  }, [dispatch, scanQueueTargets]);

  // スキャンキューの処理2 - NDL検索結果から取得できたらスキャンキューからdequeue
  useEffect(() => {
    const findIsbnList = scanQueueTargets.flatMap(
      (isbn): { isbn: Isbn13; result: ScanFinishedItemMapValue | null }[] => {
        const key = JSON.stringify({ isbn });
        if (!(key in ndlSearchQueueResults)) return [];
        const ndlSearchQueueResult = ndlSearchQueueResults[key];
        if (!ndlSearchQueueResult.length) return [{ isbn, result: null }];
        const result = getScannedItemMapValueByBookData(collections, ndlSearchQueueResult[0]);
        const _filterSets: FilterSet[] = filterSets.filter(filterSet =>
          filterQueueResults[JSON.stringify(filterSet.fetch)]?.some(book => book.isbn === isbn)
        );
        const wrappedFilterSets =
          _filterSets.length > 0
            ? _filterSets
            : [
                {
                  id: '',
                  name: result.bookDetail?.book.title ?? '無名のフィルター',
                  fetch: {
                    title: result.bookDetail?.book.title ?? '無名',
                    publisher: result.bookDetail?.book.publisher ?? '',
                    creator: result.bookDetail?.book.creator?.at(0) ?? '',
                    usePublisher: true,
                    useCreator: true,
                  },
                  filters: [],
                  createdAt: '',
                  updatedAt: '',
                  owner: '',
                } as const satisfies FilterSet,
              ];
        result.filterSets.push(...wrappedFilterSets);

        return [{ isbn, result }];
      }
    );
    dispatch(dequeueScan({ list: findIsbnList, retryList: [] }));
    dispatch(
      enqueueNdlSearch({
        options: findIsbnList.flatMap(({ result }): string[] => {
          if (!result) return [];
          return result.filterSets.map(filterSet => makeNdlOptionsStringByNdlFullOptions(filterSet.fetch));
        }),
        type: 'new',
      })
    );
  }, [dispatch, scanQueueTargets, ndlSearchQueueResults, collections, filterSets, filterQueueResults]);

  // 蔵書のグループ本を全て検索する
  useEffect(() => {
    filterSets.forEach(filterSet => {
      dispatch(enqueueNdlSearch({ options: [makeNdlOptionsStringByNdlFullOptions(filterSet.fetch)], type: 'new' }));
    });
  }, [dispatch, filterSets]);

  // 読み込み書籍のグループ本のフィルターが変更される毎に検索結果を取得し直す
  useEffect(() => {
    dispatch(enqueueNdlSearch({ options: selectedScannedItemFetchOptions, type: 'priority' }));
  }, [dispatch, selectedScannedItemFetchOptions]);

  // NDL検索キューの処理
  useEffect(() => {
    if (!ndlSearchQueueTargets.length) return;
    Promise.all(
      ndlSearchQueueTargets.map(
        optionsStr =>
          new Promise<{ option: string; books: BookData[] }>(resolve => {
            const requestOptions = JSON.parse(optionsStr) as NdlOptions;
            fetchNdlSearch(requestOptions).then(books => {
              dispatch(enqueueBookImage({ isbnList: books.map(({ isbn }) => isbn), type: 'new' }));
              resolve({ option: optionsStr, books });
            });
          })
      )
    ).then(list => {
      console.log('fetchNdlSearch done', list);
      dispatch(dequeueNdlSearch(list));
    });
  }, [dispatch, ndlSearchQueueTargets]);

  return children;
}
