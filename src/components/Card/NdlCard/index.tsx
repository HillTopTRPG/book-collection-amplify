import { Fragment, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import HighLightText from '@/components/Card/NdlCard/HighLightText.tsx';
import OverPanel from '@/components/Card/NdlCard/OverPanel.tsx';
import TempItem from '@/components/TempItem.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  ndl: BookData;
  filterSets: FilterSet[];
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  onOpenBookDetail: (isbn: string | null) => void;
};

export default function NdlCard({ ndl, filterSets, selectedIsbn, setSelectedIsbn, onOpenBookDetail }: Props) {
  const isbn = ndl.isbn;

  const options = useMemo(() => filterSets.at(0)?.fetch, [filterSets]);

  const isViewTitle = useMemo(() => options?.title !== ndl.title, [ndl.title, options?.title]);
  const creatorText = useMemo(() => ndl.creator?.join(', ') ?? '', [ndl.creator]);
  const isViewCreator = useMemo(
    () => !options?.useCreator && options?.creator !== creatorText,
    [creatorText, options?.useCreator, options?.creator]
  );
  const isViewPublisher = useMemo(
    () => !options?.usePublisher && options?.publisher !== ndl.publisher,
    [ndl.publisher, options?.usePublisher, options?.publisher]
  );

  const anywhere = useMemo(() => filterSets.at(0)?.filters.at(0)?.at(0)?.anywhere, [filterSets]);

  return (
    <CardFrame className="flex-col gap-1">
      <div className="flex flex-wrap justify-start w-full">
        {ndl.ndcLabels.map((label, idx) => (
          <Fragment key={idx}>
            {idx ? <ChevronRight width={10} /> : ''}
            <Badge variant="secondary" className="text-[8px]">
              <HighLightText value={label} subStr={anywhere} subClassName="bg-yellow-700" />
            </Badge>
          </Fragment>
        ))}
      </div>
      <div className="flex items-start gap-1.5">
        <BookImage isbn={isbn} onClick={() => onOpenBookDetail(isbn)} />
        <div
          className="flex items-baseline flex-wrap gap-x-3 flex-1 pl-1.5 relative"
          onClick={() => setSelectedIsbn(isbn)}
        >
          {selectedIsbn === isbn ? (
            <OverPanel onClose={() => setSelectedIsbn(null)}>
              <Button>登録</Button>
              <Button>欲しい</Button>
            </OverPanel>
          ) : null}
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            {isViewTitle ? (
              <TempItem value={ndl.title} highLight={anywhere} className="text-lg font-bold inline-block" />
            ) : null}
            <TempItem value={ndl.volume} highLight={anywhere} className="text-lg font-bold" />
            <TempItem value={ndl.volumeTitle} highLight={anywhere} className="text-lg font-bold" />
          </div>
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            {isViewCreator ? <TempItem value={creatorText} highLight={anywhere} className="text-xs" /> : null}
            {isViewPublisher ? <TempItem value={ndl.publisher} highLight={anywhere} className="text-xs" /> : null}
          </div>
          <TempItem value={ndl.edition} highLight={anywhere} className="text-xs" />
          <TempItem value={ndl.date} highLight={anywhere} label="発売日" className="text-xs" />
          {!ndl.ndcLabels.length && ndl.ndc ? (
            <TempItem value={ndl.ndc} highLight={anywhere} label="分類コード" className="text-xs" />
          ) : null}
          <TempItem value={ndl.seriesTitle} label="シリーズ" highLight={anywhere} className="text-xs" />
          <TempItem value={ndl.extent} label="商品形態" highLight={anywhere} className="text-xs" />
          <TempItem
            value={ndl.isbn?.replaceAll('-', '')}
            label="ISBN"
            highLight={anywhere}
            className="w-full text-xs text-gray-400"
          />
        </div>
      </div>
    </CardFrame>
  );
}
