import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks.ts';
import { enqueueScan } from '@/store/scannerSlice.ts';
import { getScannedIsbnToLocalStorage } from '@/utils/localStorage.ts';

export default function useLocalStorage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(enqueueScan({ type: 'new', list: getScannedIsbnToLocalStorage() }));
  }, [dispatch]);
}
