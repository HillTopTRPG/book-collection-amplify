import {BookData} from '@/types/book.ts';
import {Spinner} from '@/components/ui/shadcn-io/spinner';
import {Fragment} from 'react';
import {ImageOff} from 'lucide-react';

type Props = {
  book: BookData | null;
};

export default function BookCardContent({ book }: Props) {
  if (!book) return <Spinner variant="bars" />;
  return (
    <Fragment>
      {book?.cover ? (
        <img src={book.cover} alt="表紙" className="w-[50px] h-[75px] rounded border" style={{ objectFit: 'cover' }} />
      ) : <div className="w-[50px] h-[75px] rounded border flex items-center justify-center"><ImageOff /></div>}
      <div className="flex-1">
        <h5 className="text-[14px] mb-1">{book.title}</h5>
        <h5 className="text-[13px] mb-1">{book.subtitle}</h5>
        <p className="text-[12px] my-0.5 text-[#666]">{book.author} / {book.publisher}</p>
        <p className="text-[10px] mt-1 text-[#999]" style={{ fontFamily: 'monospace' }}>
          {book.isbn} / {book.pubdate}
        </p>
      </div>
    </Fragment>
  );
}
