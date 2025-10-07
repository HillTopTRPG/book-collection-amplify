import type { CollectionBook, FilterSet, Isbn13 } from '@/types/book.ts';
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
  viewType?: 'default' | 'simple';
  className?: string;
  style?: CSSProperties;
  collectionBook: CollectionBook | null;
  filterSet?: FilterSet;
  orIndex?: number;
  onOpenBook?: (isbn: string | null) => void;
  onClick?: (isbn: Isbn13) => void;
};

export default function BookCard({
  viewType = 'default',
  className,
  style,
  collectionBook,
  onClick,
  filterSet,
  orIndex,
  onOpenBook,
}: Props) {
  const isbn = useMemo(() => collectionBook?.isbn ?? null, [collectionBook?.isbn]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (onOpenBook) {
        onOpenBook(isbn);
        e.stopPropagation();
      }
    },
    [onOpenBook, isbn]
  );

  const creatorText = useMemo(() => collectionBook?.creator?.join(', ') ?? '', [collectionBook?.creator]);
  const isViewCreator = useMemo(
    () => !filterSet?.fetch.useCreator && filterSet?.fetch.creator !== creatorText,
    [creatorText, filterSet?.fetch.creator, filterSet?.fetch.useCreator]
  );
  const isViewPublisher = useMemo(
    () => !filterSet?.fetch.usePublisher && filterSet?.fetch.publisher !== collectionBook?.publisher,
    [collectionBook?.publisher, filterSet?.fetch.publisher, filterSet?.fetch.usePublisher]
  );
  const keywords = useMemo(
    () => (orIndex !== undefined ? (filterSet?.filters[orIndex].list.map(({ keyword }) => keyword) ?? []) : []),
    [filterSet?.filters, orIndex]
  );

  const ndcLabels = useMemo(
    () => (
      <div className="flex flex-wrap justify-start items-center gap-y-1">
        {collectionBook?.ndcLabels.map((label, idx) => (
          <Fragment key={idx}>
            {idx ? <ChevronRight width={10} height={10} /> : ''}
            <Badge variant="secondary" className="text-[8px] leading-3 h-4 px-1 py-0">
              <HighLightText value={label} subStrList={keywords} subClassName="bg-yellow-700" />
            </Badge>
          </Fragment>
        ))}
      </div>
    ),
    [collectionBook?.ndcLabels, keywords]
  );

  const titleText = useMemo(
    () =>
      [collectionBook?.title, collectionBook?.volume, collectionBook?.volumeTitle]
        .flatMap(v => (v ? [v] : []))
        .join(' '),
    [collectionBook?.title, collectionBook?.volume, collectionBook?.volumeTitle]
  );

  const title = useMemo(
    () => (
      <div className="w-full flex items-baseline flex-wrap gap-x-3">
        <TempItem value={titleText} highLights={keywords} className="text-sm/5 font-bold" />
      </div>
    ),
    [titleText, keywords]
  );
  const publisher = useMemo(() => {
    if (!isViewCreator && !isViewPublisher) return null;
    if (!creatorText && !collectionBook?.publisher) return null;
    return (
      <div className="w-full flex items-baseline flex-wrap gap-x-3">
        {isViewCreator ? <TempItem value={creatorText} highLights={keywords} className="text-xs" /> : null}
        {isViewPublisher ? (
          <TempItem value={collectionBook?.publisher} highLights={keywords} className="text-xs" />
        ) : null}
      </div>
    );
  }, [collectionBook?.publisher, creatorText, isViewCreator, isViewPublisher, keywords]);
  const edition = useMemo(
    () => <TempItem value={collectionBook?.edition} highLights={keywords} className="text-xs" />,
    [collectionBook?.edition, keywords]
  );
  const date = useMemo(
    () => <TempItem value={collectionBook?.date} highLights={keywords} label="発売日" className="text-xs" />,
    [collectionBook?.date, keywords]
  );
  const ndc = useMemo(
    () =>
      !collectionBook?.ndcLabels.length ? (
        <TempItem value={collectionBook?.ndc} highLights={keywords} label="分類コード" className="text-xs" />
      ) : null,
    [collectionBook?.ndc, collectionBook?.ndcLabels.length, keywords]
  );
  const seriesTitle = useMemo(
    () => <TempItem value={collectionBook?.seriesTitle} label="シリーズ" highLights={keywords} className="text-xs" />,
    [collectionBook?.seriesTitle, keywords]
  );
  const extent = useMemo(
    () => <TempItem value={collectionBook?.extent} label="" highLights={keywords} className="text-xs" />,
    [collectionBook?.extent, keywords]
  );
  const isbnElm = useMemo(
    () => <TempItem value={isbn} label="ISBN" highLights={keywords} className="w-full text-right text-xs" />,
    [isbn, keywords]
  );

  const content = useMemo(
    () => (
      <>
        {viewType === 'default' && ndcLabels}
        <div className="flex items-stretch w-full gap-1.5">
          <BookImage isbn={isbn} onClick={handleImageClick} />
          <div className="flex items-baseline content-start flex-wrap gap-x-3 flex-1 pl-1.5 py-0.5 relative">
            {title}
            {publisher}
            {edition}
            {date}
            {viewType === 'default' && ndc}
            {viewType === 'default' && seriesTitle}
            {extent}
            {viewType === 'default' && isbnElm}
          </div>
        </div>
      </>
    ),
    [date, edition, extent, handleImageClick, isbn, isbnElm, ndc, ndcLabels, publisher, seriesTitle, title, viewType]
  );

  const onClickWrap = useCallback(() => {
    if (!isbn) return;
    onClick?.(isbn);
  }, [isbn, onClick]);

  return (
    <CardFrame
      onClick={onClick ? onClickWrap : undefined}
      className={cn('flex-col items-start gap-1 px-2', className)}
      style={style}
    >
      {!collectionBook ? <Spinner variant="bars" /> : content}
    </CardFrame>
  );
}
