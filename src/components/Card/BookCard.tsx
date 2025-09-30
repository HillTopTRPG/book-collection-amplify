import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail, Isbn13 } from '@/types/book.ts';
import type { CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import { Fragment, useCallback, useMemo } from 'react';
import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import TempItem from '@/components/TempItem.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { cn } from '@/lib/utils.ts';
import HighLightText from './HighLightText.tsx';

type Props = {
  className?: string;
  style?: CSSProperties;
  bookDetail: BookDetail | null;
  filterSet?: FilterSet;
  orIndex?: number;
  onOpenBookDetail?: (isbn: string | null) => void;
  onClick?: (isbn: Isbn13) => void;
};

export default function BookCard({
  className,
  style,
  bookDetail,
  onClick,
  filterSet,
  orIndex,
  onOpenBookDetail,
}: Props) {
  const isbn = bookDetail?.book.isbn ?? null;

  const content = useMemo(() => {
    const book = bookDetail?.book;
    if (!book) return <Spinner variant="bars" />;

    const options = filterSet?.fetch;

    const isViewTitle = options?.title !== book.title;
    const creatorText = book.creator?.join(', ') ?? '';
    const isViewCreator = !options?.useCreator && options?.creator !== creatorText;
    const isViewPublisher = !options?.usePublisher && options?.publisher !== book.publisher;

    const anywhereList =
      orIndex !== undefined ? (filterSet?.filters[orIndex].list.map(({ keyword }) => keyword) ?? []) : [];

    return (
      <>
        <div className="flex flex-wrap justify-start items-center gap-y-1">
          {book.ndcLabels.map((label, idx) => (
            <Fragment key={idx}>
              {idx ? <ChevronRight width={10} height={10} /> : ''}
              <Badge variant="secondary" className="text-[8px] leading-3 h-4 px-1 py-0">
                <HighLightText value={label} subStrList={anywhereList} subClassName="bg-yellow-700" />
              </Badge>
            </Fragment>
          ))}
        </div>
        <div className="flex items-stretch w-full gap-1.5">
          <BookImage
            isbn={isbn}
            onClick={e => {
              if (onOpenBookDetail) {
                onOpenBookDetail(isbn);
                e.stopPropagation();
              }
            }}
          />
          <div className="flex items-baseline flex-wrap gap-x-3 flex-1 pl-1.5 relative">
            <div className="w-full flex items-baseline flex-wrap gap-x-3">
              <TempItem
                value={isViewTitle ? book.title : null}
                highLights={anywhereList}
                className="text-base/5 font-bold"
              />
            </div>
            <div className="w-full flex items-baseline flex-wrap gap-x-3">
              <TempItem value={book.volume} highLights={anywhereList} className="text-base/5 font-bold" />
            </div>
            <div className="w-full flex items-baseline flex-wrap gap-x-3">
              <TempItem value={book.volumeTitle} highLights={anywhereList} className="text-base/5 font-bold" />
            </div>
            <div className="w-full flex items-baseline flex-wrap gap-x-3">
              {isViewCreator ? <TempItem value={creatorText} highLights={anywhereList} className="text-xs" /> : null}
              {isViewPublisher ? (
                <TempItem value={book.publisher} highLights={anywhereList} className="text-xs" />
              ) : null}
            </div>
            <TempItem value={book.edition} highLights={anywhereList} className="text-xs" />
            <TempItem value={book.date} highLights={anywhereList} label="発売日" className="text-xs" />
            {!book.ndcLabels.length && book.ndc ? (
              <TempItem value={book.ndc} highLights={anywhereList} label="分類コード" className="text-xs" />
            ) : null}
            <TempItem value={book.seriesTitle} label="シリーズ" highLights={anywhereList} className="text-xs" />
            <TempItem value={book.extent} label="商品形態" highLights={anywhereList} className="text-xs" />
            <TempItem value={book.isbn} label="ISBN" highLights={anywhereList} className="w-full text-xs" />
          </div>
        </div>
      </>
    );
  }, [bookDetail?.book, filterSet?.fetch, filterSet?.filters, isbn, onOpenBookDetail, orIndex]);

  const onClickWrap = useCallback(() => {
    if (!isbn) return;
    onClick?.(isbn);
  }, [isbn, onClick]);

  return (
    <CardFrame onClick={onClickWrap} className={cn('flex-col items-start gap-1 py-1 px-2', className)} style={style}>
      {content}
    </CardFrame>
  );
}
