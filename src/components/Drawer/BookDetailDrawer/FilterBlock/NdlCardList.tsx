import { Fragment } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import { Separator } from '@/components/ui/separator.tsx';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  books: BookData[];
  filterSet: FilterSet;
  orIndex: number;
  selectedIsbn: string | null;
  setSelectedIsbn: (isbn: string | null) => void;
  setDetailIsbn: (isbn: string | null) => void;
  openType?: 'collapse' | 'full' | 'close';
  setOpenType?: (openType: 'collapse' | 'full' | 'close') => void;
};

export default function NdlCardList({
  books,
  filterSet,
  orIndex,
  selectedIsbn,
  setSelectedIsbn,
  setDetailIsbn,
  openType,
  setOpenType,
}: Props) {
  if (openType && !['collapse', 'full'].some(v => v === openType)) return null;
  const isCollapse = openType === 'collapse' && books.length > 5;
  const collapseButtonIndex = 2;

  return (
    <div className="flex flex-col">
      {books.map((ndl, idx) => (
        <Fragment key={idx}>
          {!isCollapse || idx < 2 || books.length - 3 < idx ? (
            <>
              {idx ? <Separator /> : null}
              <NdlCard
                {...{ ndl, filterSet, orIndex, selectedIsbn, setSelectedIsbn }}
                onOpenBookDetail={isbn => {
                  setDetailIsbn(isbn);
                  setSelectedIsbn(null);
                }}
              />
            </>
          ) : null}
          {isCollapse && idx == collapseButtonIndex ? (
            <>
              <Separator />
              <div
                className="flex py-2 items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={() => setOpenType?.('full')}
              >
                全て表示する
              </div>
            </>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
