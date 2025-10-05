import type { Isbn13 } from '@/types/book.ts';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import { useLogs } from '@/hooks/useLogs.ts';
import CollectionBooksFilterResultView from '@/pages/BookPage/CollectionBooksFilterResultView.tsx';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectCollectionBookByIsbn } from '@/store/scannerSlice.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';

const BOTTOM_NAVIGATION_HEIGHT = 65;

type Props = {
  isbn: Isbn13;
};

export default function ScannedBookView({ isbn }: Props) {
  const dispatch = useAppDispatch();
  const [contentHeight, setContentHeight] = useState(0);
  const collectionBook = useAppSelector(state => selectCollectionBookByIsbn(state, isbn));

  // パフォーマンスログ
  useLogs({
    componentName: 'ScannedBookView',
    additionalInfo: `ISBN: ${isbn}`,
  });

  // scrollParentRef を useEffect で初期化（レンダリング時の DOM 検索を回避）
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollParentRef.current) {
      scrollParentRef.current = document.getElementById('root') as HTMLDivElement;
    }
  }, []);

  const minHeightStyle = useMemo(
    () =>
      ({
        '--content-end-y': `${contentHeight + BOTTOM_NAVIGATION_HEIGHT}px`,
      }) as CSSProperties,
    [contentHeight]
  );

  const bookCardNavi = useMemo(() => {
    const handleBookOpen = () => {
      dispatch(setBookDialogValue(collectionBook));
    };

    return (
      <div className="bg-background">
        <BookCardNavi collectionBook={collectionBook} onOpenBook={handleBookOpen} />
      </div>
    );
  }, [collectionBook, dispatch]);

  return (
    <div className="flex flex-col w-full flex-1">
      <div className="flex flex-col gap-3 pt-3">
        {bookCardNavi}
        {collectionBook ? (
          <CollectionBooksFilterResultView
            setContentHeight={setContentHeight}
            {...{ collectionBook, scrollParentRef }}
          />
        ) : null}
      </div>

      <div className="min-h-viewport-with-offset" style={minHeightStyle} />
    </div>
  );
}
