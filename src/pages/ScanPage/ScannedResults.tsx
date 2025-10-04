import type { AppDispatch } from '@/store';
import type { BookData, Isbn13 } from '@/types/book.ts';
import { X } from 'lucide-react';
import { Fragment, memo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { clearScanViewList, selectScanResultList } from '@/store/scannerSlice.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';

type ScanResultItemType = {
  isbn: Isbn13;
  status: 'loading' | 'none' | 'done';
  book: BookData | null;
};

const ScanResultItem = memo(({ result, index }: { result: ScanResultItemType; index: number }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    console.log(result.book?.isbn);
    void navigate(`/scan/${result.book?.isbn}`);
  }, [navigate, result.book?.isbn]);

  const handleOpenDetail = useCallback(() => {
    dispatch(setBookDialogValue(result.book));
  }, [dispatch, result.book]);

  return (
    <Fragment>
      {index > 0 && <Separator />}
      <BookCardNavi book={result.book} onClick={handleClick} onOpenBook={handleOpenDetail} />
    </Fragment>
  );
});
ScanResultItem.displayName = 'ScanResultItem';

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scanResultList = useAppSelector(selectScanResultList);

  const clearDisable = !scanResultList.length;

  const onClear = useCallback(() => {
    dispatch(clearScanViewList());
  }, [dispatch]);

  return (
    <div className="flex-1 flex flex-col w-full bg-background">
      <div className="flex gap-3 justify-between items-center p-1">
        <h1 className="text-sm">読み込んだ書籍一覧</h1>
        <Button className="rounded-full" variant="outline" size="sm" onClick={onClear} disabled={clearDisable}>
          <X />
          クリア
        </Button>
      </div>
      <Separator />
      <ScrollArea className="w-full max-h-max">
        {scanResultList.map((result, index) => (
          <ScanResultItem key={index} result={result} index={index} />
        ))}
        {!scanResultList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
