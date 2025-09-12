import { Fragment } from 'react';

import { Spinner } from '@/components/ui/shadcn-io/spinner';
import type { BookData } from '@/types/book.ts';

type Props = {
  book: BookData | null;
  isNoHave?: boolean;
  isAlreadyHave?: boolean;
};

export default function BookCardContent({ book, isNoHave, isAlreadyHave }: Props) {
  if (!book) return <Spinner variant="bars" />;
  return (
    <Fragment>
      <img src={book.cover || `https://ndlsearch.ndl.go.jp/thumbnail/${book.isbn}.jpg`} alt="表紙" className="w-[50px] h-[75px] rounded border" style={{ objectFit: 'cover' }} />
      <div className="flex-1">
        <h5 className="text-[14px] mb-1">{book.title}</h5>
        <h5 className="text-[13px] mb-1">{book.subtitle}</h5>
        <p className="text-[12px] my-0.5 text-[#666]">{book.author} / {book.publisher}</p>
        <p className="text-[10px] mt-1 text-[#999]" style={{ fontFamily: 'monospace' }}>
          {book.isbn} / {book.pubdate}
        </p>
      </div>
      {isNoHave ? <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none">未所持</div> : null}
      {isAlreadyHave ? <div className="absolute inset-0 bg-yellow-200/50 pointer-events-none text-orange-600 text-stroke-3 font-bold text-stroke-white">既に持っています</div> : null}
    </Fragment>
  );
}
