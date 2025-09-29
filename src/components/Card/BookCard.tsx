import type { BookDetail, Isbn13 } from '@/types/book.ts';
import { useCallback, useMemo } from 'react';
import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { BookStatusEnum } from '@/store/subscriptionDataSlice.ts';

type Props = {
  bookDetail: BookDetail | null;
  onClick?: (isbn: Isbn13) => void;
};

export default function BookCard({ bookDetail, onClick }: Props) {
  const { getCollectionByIdInfo } = useIdInfo();
  const isbn = bookDetail?.book?.isbn ?? null;

  const content = useMemo(() => {
    if (!bookDetail?.book) return <Spinner variant="bars" />;
    const collection = getCollectionByIdInfo(bookDetail?.collection);
    const bookStatus = collection?.meta.status ?? BookStatusEnum.Unregistered;

    if (bookDetail.book.isbn === '9784063197433') {
      console.log('bookStatus', bookStatus);
    }

    return (
      <>
        <BookImage isbn={isbn} />
        <div className="flex-1">
          <h5 className="text-[14px] mb-1">{bookDetail.book.title}</h5>
          <h5 className="text-[13px] mb-1">{bookDetail.book.volume || bookDetail.book.volumeTitle}</h5>
          <p className="text-[12px] my-0.5 text-[#666]">
            {bookDetail.book.creator?.join(', ')} / {bookDetail.book.publisher}
          </p>
          <p className="text-[10px] mt-1 text-[#999]" style={{ fontFamily: 'monospace' }}>
            {bookDetail.book.isbn} / {bookDetail.book.date}
          </p>
        </div>
        {bookStatus === BookStatusEnum.Owned ? (
          <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none">所持済み</div>
        ) : null}
        {bookStatus === BookStatusEnum.Planned ? (
          <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none">購入予定</div>
        ) : null}
      </>
    );
  }, [bookDetail?.book, bookDetail?.collection, getCollectionByIdInfo, isbn]);

  const onClickWrap = useCallback(() => {
    if (!isbn) return;
    onClick?.(isbn);
  }, [isbn, onClick]);

  return <CardFrame onClick={onClickWrap}>{content}</CardFrame>;
}
