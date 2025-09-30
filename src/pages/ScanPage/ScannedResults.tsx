import type { AppDispatch } from '@/store';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Fragment, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import BookCardNavi from '@/pages/ScannedBookPage/FilterBlock/BookCardNavi.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { clearScanViewList, selectScanResultList } from '@/store/scannerSlice.ts';
import { setBookDetailDialogValue } from '@/store/uiSlice.ts';

export default function ScannedResults() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const scanResultList = useAppSelector(selectScanResultList);

  const clearDisable = !scanResultList.length;

  const onClear = useCallback(() => {
    dispatch(clearScanViewList());
  }, [dispatch]);

  // const onRegister = useCallback(async () => {
  //   setRegistering(true);
  //   for (const { isbn, result: scanningItemMapValue } of scanResultList) {
  //     if (!scanningItemMapValue) return;
  //     const bookDetail = scanningItemMapValue.bookDetail;
  //     const collection = getCollectionByIdInfo(bookDetail.collection);
  //
  //     // ステータスが未登録以外の蔵書はDBに登録する
  //     if (bookDetail.collection.type === 'temp' && collection.meta.status !== BookStatusEnum.Unregistered) {
  //       userPoolClient.models.Collection.create({ isbn, meta: JSON.stringify(collection.meta), memo: '' });
  //       await wait(100);
  //     }
  //
  //     const isHave = collection.meta.status === BookStatusEnum.Owned;
  //     const { title } = bookDetail.book;
  //
  //     // 未登録のフィルターを登録する
  //     for (const idInfo of scanningItemMapValue.filterSets.filter(({ type }) => type === 'temp')) {
  //       const filterSet = getFilterSetByIdInfo(idInfo);
  //       userPoolClient.models.FilterSet.create({
  //         ...filterSet,
  //         fetch: JSON.stringify(filterSet.fetch),
  //         filters: JSON.stringify(filterSet.filters),
  //       });
  //       await wait(100);
  //     }
  //
  //     setTimeout(() => {
  //       toast({
  //         title: isHave ? '登録スキップ' : '登録',
  //         description: `${title}`,
  //         duration: 2000,
  //       });
  //     });
  //   }
  //   onClear();
  //   setRegistering(false);
  // }, [getCollectionByIdInfo, getFilterSetByIdInfo, onClear, scanResultList, toast]);

  return (
    <div className="flex-1 flex flex-col w-full bg-background">
      <div className="flex gap-3 justify-between items-center p-1">
        <h1 className="text-sm">読み込んだ書籍一覧</h1>
        <Button className="rounded-full" size="sm" onClick={onClear} disabled={clearDisable}>
          クリア
        </Button>
      </div>
      <Separator />
      <ScrollArea className="w-full max-h-max">
        {scanResultList.map(({ result }, index) => (
          <Fragment key={index}>
            {index > 0 && <Separator />}
            <BookCardNavi
              bookDetail={result?.bookDetail ?? null}
              onClick={isbn => {
                console.log(isbn);
                navigate(`/scan/${result?.isbn}`);
              }}
              onOpenBookDetail={() => {
                dispatch(setBookDetailDialogValue(result?.bookDetail ?? null));
              }}
            />
          </Fragment>
        ))}
        {!scanResultList.length && <p className="w-full text-center text-xs">まだ１冊も読み込まれていません。</p>}
      </ScrollArea>
    </div>
  );
}
