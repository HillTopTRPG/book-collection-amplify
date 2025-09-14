import { Fragment, useCallback, useState } from 'react';

import { Button } from '@aws-amplify/ui-react';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { generateClient } from 'aws-amplify/data';
import { useDispatch } from 'react-redux';

import BookCard from '@/components/Card/BookCard';
import { Separator } from '@/components/ui/separator.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import type { AppDispatch } from '@/store';
import { useAppSelector } from '@/store/hooks.ts';
import { clearScannedItems, selectScannedItems } from '@/store/scannerSlice.ts';
import { wait } from '@/utils/primitive.ts';

import type { Schema } from '$/amplify/data/resource.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool'
});

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scannedDataList = useAppSelector(selectScannedItems);
  const { toast } = useToast();
  const [registing, setRegisting] = useState(false);

  const clearDisable = !scannedDataList.length;
  const registerDisable = clearDisable || scannedDataList.some(({ bookDetail }) => !bookDetail) || registing;

  const onClear = useCallback(() => {
    dispatch(clearScannedItems());
  }, [dispatch]);

  const onRegister = useCallback(async () => {
    setRegisting(true);
    for (const scannedItem of scannedDataList) {
      if (!scannedItem.bookDetail?.book) return;
      const isHave = scannedItem.bookDetail.isHave;
      const { isbn, title } = scannedItem.bookDetail.book;

      // 未登録の蔵書を登録する
      if (!isHave) {
        userPoolClient.models.Collection.create({ isbn, meta: '', memo: '' });
        await wait(100);
      }

      // 未登録のフィルターを登録する
      for (const filterSet of scannedItem.filterSets.filter(({ id }) => !id)) {
        const titleFilter = filterSet.filters.find(({ type }) => type === 'title');
        userPoolClient.models.FilterSet.create({
          name: titleFilter?.value || '無名のフィルター',
          filters: JSON.stringify(filterSet.filters),
          meta: '{}'
        });
        await wait(100);
      }

      setTimeout(() => {
        toast({
          title: isHave ? '登録スキップ' : '登録',
          description: `${title}`,
          duration: 2000,
        });
      });
    }
    onClear();
    setRegisting(false);
  }, [onClear, scannedDataList, toast]);

  return (
    <div className="flex-1 flex flex-col gap-3 w-full bg-background rounded-lg shadow-lg p-2">
      {scannedDataList.length > 0 && (
        <Fragment>
          <div className="flex gap-3 justify-end">
            <Button variation="primary" className="rounded-full flex-1" onClick={onRegister} disabled={registerDisable}>
            登録
            </Button>
            <Button size="small" variation="destructive" className="rounded-full" onClick={onClear} disabled={clearDisable}>
            クリア
            </Button>
          </div>
          <Separator />
        </Fragment>
      )}
      <ScrollArea className="w-full max-h-max px-1">
        {scannedDataList.map(({ bookDetail }, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator className="my-2" />}
            <BookCard bookDetail={bookDetail} />
          </Fragment>
        ))}
        {!scannedDataList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
