import type { BookDetail } from '@/store/filterDetailDrawerSlice.ts';
import type { Isbn13 } from '@/types/book.ts';
import { useCallback } from 'react';
import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';

type Props = {
  bookDetail: BookDetail | null;
  onClick?: (isbn: Isbn13) => void;
};

export default function BookCard({ bookDetail, onClick }: Props) {
  const isbn = bookDetail?.book?.isbn ?? null;

  const onClickWrap = useCallback(() => {
    if (!isbn) return;
    onClick?.(isbn);
  }, [isbn, onClick]);

  return (
    <CardFrame onClick={onClickWrap}>
      {!bookDetail?.book ? (
        <Spinner variant="bars" />
      ) : (
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
          {bookDetail.isHave ? null : (
            <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none">未所持</div>
          )}
          {bookDetail.isWant ? (
            <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none">購入予定</div>
          ) : null}
        </>
      )}
    </CardFrame>
  );
}
