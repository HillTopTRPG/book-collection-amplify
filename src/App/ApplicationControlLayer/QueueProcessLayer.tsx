import type { ReactNode } from 'react';
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
import {
  selectAllFilterSets,
  selectCollections,
  selectFilterSets,
  selectTempCollections,
} from '@/store/subscriptionDataSlice.ts';
import { callGoogleBooksApi } from '@/utils/fetch/google.ts';
import { callNdlSearchApi } from '@/utils/fetch/ndl.tsx';
import { callRakutenBooksApi } from '@/utils/fetch/rakuten.ts';
import { getKeys } from '@/utils/type.ts';
import useBookImageQueueProcessor from './useBookImageQueueProcessor.ts';
import useNdlSearchQueueEnqueueer from './useNdlSearchQueueEnqueueer.ts';
import useScanQueueProcessor from './useScanQueueProcessor.ts';

type Props = {
  children: ReactNode;
};

export default function QueueProcessLayer({ children }: Props) {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectCollections);
  const tempCollections = useAppSelector(selectTempCollections);
  const filterSets = useAppSelector(selectFilterSets);
  const allFilterSets = useAppSelector(selectAllFilterSets);
  const allNdlSearchQueueResults = useAppSelector(selectAllNdlSearchResults);

  useLocalStorage();
  useBookImageQueueProcessor();
  useNdlSearchQueueEnqueueer({ collections, tempCollections, allFilterSets });
  useScanQueueProcessor({ collections, tempCollections, filterSets, allNdlSearchQueueResults });

  const google = useSearchQueueProcessor(
    selectGoogleSearchTargets,
    callGoogleBooksApi,
    dequeueGoogleSearch,
    enqueueGoogleSearch,
    5000
  );
  const rakuten = useSearchQueueProcessor(
    selectRakutenSearchTargets,
    callRakutenBooksApi,
    dequeueRakutenSearch,
    enqueueRakutenSearch,
    5000
  );
  const ndl = useSearchQueueProcessor(
    selectNdlSearchTargets,
    callNdlSearchApi,
    dequeueNdlSearch,
    enqueueNdlSearch,
    1000,
    results => {
      const isbnList = getKeys(results).flatMap(optionsStr => {
        const books = results[optionsStr];

        return books === 'retrying' ? [] : books.list.map(b => b.isbn);
      });

      if (isbnList.length) dispatch(enqueueBookImage({ type: 'new', list: isbnList }));
    }
  );

  useInterval(() => {
    google();
    rakuten();
    ndl();
  }, 100);

  return children;
}
