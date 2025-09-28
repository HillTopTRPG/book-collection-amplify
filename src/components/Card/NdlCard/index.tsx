import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import { ChevronRight } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import HighLightText from '@/components/Card/NdlCard/HighLightText.tsx';
import OverPanel from '@/components/Card/NdlCard/OverPanel.tsx';
import TempItem from '@/components/TempItem.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';

type Props = {
  className?: string;
  ndl: BookData;
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  onOpenBookDetail: (isbn: string | null) => void;
};

export default function NdlCard({
  className,
  ndl,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  onOpenBookDetail,
}: Props) {
  const isbn = ndl.isbn;

  const options = useMemo(() => filterSet.fetch, [filterSet.fetch]);

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

  const anywhereList = useMemo(
    () => filterSet.filters[orIndex].list.map(({ keyword }) => keyword) ?? [],
    [orIndex, filterSet.filters]
  );

  return (
    <CardFrame className={cn('flex-col gap-1 py-1 px-2', className)}>
      <div className="flex flex-wrap justify-start w-full">
        {ndl.ndcLabels.map((label, idx) => (
          <Fragment key={idx}>
            {idx ? <ChevronRight width={10} /> : ''}
            <Badge variant="secondary" className="text-[8px]">
              <HighLightText value={label} subStrList={anywhereList} subClassName="bg-yellow-700" />
            </Badge>
          </Fragment>
        ))}
      </div>
      <div className="flex items-stretch w-full gap-1.5">
        <BookImage isbn={isbn} onClick={() => onOpenBookDetail(isbn)} />
        <div
          className="flex items-baseline flex-wrap gap-x-3 flex-1 pl-1.5 relative"
          // onClick={() => setSelectedIsbn(isbn)}
        >
          {selectedIsbn === isbn ? (
            <OverPanel onClose={() => setSelectedIsbn(null)}>
              <Button>登録</Button>
              <Button>欲しい</Button>
            </OverPanel>
          ) : null}
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            <TempItem
              value={isViewTitle ? ndl.title : null}
              highLights={anywhereList}
              className="text-base/5 font-bold"
            />
          </div>
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            <TempItem value={ndl.volume} highLights={anywhereList} className="text-base/5 font-bold" />
          </div>
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            <TempItem value={ndl.volumeTitle} highLights={anywhereList} className="text-base/5 font-bold" />
          </div>
          <div className="w-full flex items-baseline flex-wrap gap-x-3">
            {isViewCreator ? <TempItem value={creatorText} highLights={anywhereList} className="text-xs" /> : null}
            {isViewPublisher ? <TempItem value={ndl.publisher} highLights={anywhereList} className="text-xs" /> : null}
          </div>
          <TempItem value={ndl.edition} highLights={anywhereList} className="text-xs" />
          <TempItem value={ndl.date} highLights={anywhereList} label="発売日" className="text-xs" />
          {!ndl.ndcLabels.length && ndl.ndc ? (
            <TempItem value={ndl.ndc} highLights={anywhereList} label="分類コード" className="text-xs" />
          ) : null}
          <TempItem value={ndl.seriesTitle} label="シリーズ" highLights={anywhereList} className="text-xs" />
          <TempItem value={ndl.extent} label="商品形態" highLights={anywhereList} className="text-xs" />
          <TempItem value={ndl.isbn} label="ISBN" highLights={anywhereList} className="w-full text-xs text-gray-400" />
        </div>
      </div>
    </CardFrame>
  );
}
