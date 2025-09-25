import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks.ts';
import { enqueueScan } from '@/store/scannerSlice.ts';
import { getScannedIsbnToLocalStorage } from '@/utils/localStorage.ts';
import { unique } from '@/utils/primitive.ts';

export default function useLocalStorage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const list = unique(getScannedIsbnToLocalStorage());
    dispatch(enqueueScan({ type: 'new', list }));
  }, [dispatch]);
}
