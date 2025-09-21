import type { ReactNode } from 'react';
import useLocalStorage from '@/App/ApplicationControlLayer/useLocalStorage.ts';
import useRakutenSearchQueueProcessor from '@/App/ApplicationControlLayer/useRakutenSearchQueueProcessor.ts';
import { useAppSelector } from '@/store/hooks.ts';
import { selectCollections, selectFilterSets } from '@/store/subscriptionDataSlice.ts';
import useBookImageQueueProcessor from './useBookImageQueueProcessor.ts';
import useGoogleSearchQueueProcessor from './useGoogleSearchQueueProcessor.ts';
import useNdlSearchQueueProcessor from './useNdlSearchQueueProcessor.ts';
import useScanQueueProcessor from './useScanQueueProcessor.ts';

type Props = {
  children: ReactNode;
};

export default function QueueProcessLayer({ children }: Props) {
  const filterSets = useAppSelector(selectFilterSets);
  const collections = useAppSelector(selectCollections);

  useLocalStorage();
  useBookImageQueueProcessor();
  useNdlSearchQueueProcessor({ filterSets });
  useScanQueueProcessor({ filterSets, collections });
  useGoogleSearchQueueProcessor();
  useRakutenSearchQueueProcessor();

  return children;
}
