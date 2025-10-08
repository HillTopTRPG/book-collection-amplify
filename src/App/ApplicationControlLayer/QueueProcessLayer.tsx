import type { NdlSearchResult } from '@/store/fetchNdlSearchSlice.ts';
import type { BookData } from '@/types/book.ts';
import { useInterval } from 'usehooks-ts';
import useLocalStorage from '@/App/ApplicationControlLayer/useLocalStorage.ts';
import useSearchQueueProcessor from '@/App/ApplicationControlLayer/useSearchQueueProcessor.ts';
import { enqueueBookImage } from '@/store/fetchBookImageSlice.ts';
import { dequeueGoogleSearch, enqueueGoogleSearch, selectGoogleSearchTargets } from '@/store/fetchGoogleSearchSlice.ts';
import { dequeueNdlSearch, enqueueNdlSearch, selectNdlSearchTargets } from '@/store/fetchNdlSearchSlice.ts';
import {
  dequeueRakutenSearch,
  enqueueRakutenSearch,
  selectRakutenSearchTargets,
} from '@/store/fetchRakutenSearchSlice.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectAllNdlSearchResults } from '@/store/ndlSearchSlice.ts';
import { selectCollections, selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import { callGoogleBooksApi } from '@/utils/fetch/google.ts';
import { callNdlSearchApi } from '@/utils/fetch/ndl.tsx';
import { callRakutenBooksApi } from '@/utils/fetch/rakuten.ts';
import { getKeys } from '@/utils/type.ts';
import useBookImageQueueProcessor from './useBookImageQueueProcessor.ts';
import useNdlSearchQueueEnqueueer from './useNdlSearchQueueEnqueueer.ts';
import useScanQueueProcessor from './useScanQueueProcessor.ts';

export default function QueueProcessLayer() {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectCollections);
  const filterSets = useAppSelector(selectFilterSets);
  const allNdlSearchQueueResults: Record<string, BookData[]> = useAppSelector(selectAllNdlSearchResults);

  useLocalStorage();
  useBookImageQueueProcessor();
  useNdlSearchQueueEnqueueer({ collections });
  useScanQueueProcessor({ collections, filterSets, allNdlSearchQueueResults });

  const google = useSearchQueueProcessor(
    selectGoogleSearchTargets,
    callGoogleBooksApi,
    dequeueGoogleSearch,
    enqueueGoogleSearch,
    500,
    100
  );
  const rakuten = useSearchQueueProcessor(
    selectRakutenSearchTargets,
    callRakutenBooksApi,
    dequeueRakutenSearch,
    enqueueRakutenSearch,
    500,
    500
  );
  const ndl = useSearchQueueProcessor(
    selectNdlSearchTargets,
    callNdlSearchApi,
    dequeueNdlSearch,
    enqueueNdlSearch,
    1000,
    50,
    (results: Record<string, NdlSearchResult | 'retrying'>) => {
      const isbnList = getKeys(results).flatMap(optionsStr => {
        const books = results[optionsStr];
        if (books === 'retrying') return [];
        return books.list.map(({ isbn }) => isbn);
      });

      if (isbnList.length) dispatch(enqueueBookImage({ type: 'new', list: isbnList }));
    }
  );

  // 各種APIは100ms間隔より早く連続してリクエストは出さない
  useInterval(() => {
    google();
    rakuten();
    ndl();
  }, 35);

  // このコンポーネントはUIを持たない
  return null;
}
