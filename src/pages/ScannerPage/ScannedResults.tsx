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
import { clearScanViewList, selectScanResultList } from '@/store/scannerSlice.ts';
import { wait } from '@/utils/primitive.ts';
import type { Schema } from '$/amplify/data/resource.ts';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const scanResultList = useAppSelector(selectScanResultList);
  const { toast } = useToast();
  const [registering, setRegistering] = useState(false);

  const clearDisable = !scanResultList.length;
  const registrable = !clearDisable && scanResultList.some(({ status }) => status === 'done');
  const registerDisable = !registrable || registering;

  const onClear = useCallback(() => {
    dispatch(clearScanViewList());
  }, [dispatch]);

  const onRegister = useCallback(async () => {
    setRegistering(true);
    for (const { isbn, result: scanningItemMapValue } of scanResultList) {
      if (!scanningItemMapValue?.bookDetail?.book) return;
      const isHave = scanningItemMapValue.bookDetail.isHave;
      const { title } = scanningItemMapValue.bookDetail.book;

      // 未登録の蔵書を登録する
      if (!isHave) {
        userPoolClient.models.Collection.create({ isbn, meta: '', memo: '' });
        await wait(100);
      }

      // 未登録のフィルターを登録する
      for (const filterSet of scanningItemMapValue.filterSets.filter(({ id }) => !id)) {
        userPoolClient.models.FilterSet.create({
          ...filterSet,
          fetch: JSON.stringify(filterSet.fetch),
          filters: JSON.stringify(filterSet.filters),
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
    setRegistering(false);
  }, [onClear, scanResultList, toast]);

  return (
    <div className="flex-1 flex flex-col gap-3 w-full bg-background rounded-lg shadow-lg p-2">
      {registrable ? (
        <Fragment>
          <div className="flex gap-3 justify-end">
            <Button variation="primary" className="rounded-full flex-1" onClick={onRegister} disabled={registerDisable}>
              登録
            </Button>
            <Button
              size="small"
              variation="destructive"
              className="rounded-full"
              onClick={onClear}
              disabled={clearDisable}
            >
              クリア
            </Button>
          </div>
          <Separator />
        </Fragment>
      ) : null}
      <ScrollArea className="w-full max-h-max px-1">
        {scanResultList.map(({ result }, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator className="my-2" />}
            <BookCard bookDetail={result?.bookDetail ?? null} />
          </Fragment>
        ))}
        {!scanResultList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
