import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLogs } from '@/hooks/useLogs.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import { enqueueScan } from '@/store/scannerSlice.ts';
import { clearTempData } from '@/store/subscriptionDataSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import ScannedBookView from './ScannedBookView.tsx';

export default function BookPage() {
  const dispatch = useAppDispatch();
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = useMemo(() => getIsbnCode(raw), [raw]);

  // パフォーマンスログ
  useLogs({
    componentName: 'BookPage',
    additionalInfo: `ISBN: ${maybeIsbn || 'N/A'}`,
    includeDetailedMetrics: true,
    onUnmount: () => {
      dispatch(clearTempData());
      console.log('[BookPage] Global cache and temp data cleared');
    },
  });

  useEffect(() => {
    if (!maybeIsbn) return;
    const isbn = getIsbn13(maybeIsbn);
    dispatch(enqueueScan({ type: 'new', list: [isbn] }));
  }, [maybeIsbn, dispatch]);

  const content = useMemo(() => {
    if (!maybeIsbn) {
      return <div>ISBNコードを指定してください。</div>;
    }
    const isbn = getIsbn13(maybeIsbn);

    return <ScannedBookView isbn={isbn} />;
  }, [maybeIsbn]);

  return <div className="flex flex-col w-full flex-1 gap-4">{content}</div>;
}
