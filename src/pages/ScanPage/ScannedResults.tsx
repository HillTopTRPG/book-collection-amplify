import type { AppDispatch } from '@/store';
import { X } from 'lucide-react';
import { Fragment, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import ScanResultItem from '@/pages/ScanPage/ScanResultItem.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { clearScanViewList, selectScanResultList } from '@/store/scannerSlice.ts';

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
        {scanResultList.map(({ isbn, collectionBook }, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator />}
            <ScanResultItem isbn={isbn} collectionBook={collectionBook} />
          </Fragment>
        ))}
        {!scanResultList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
