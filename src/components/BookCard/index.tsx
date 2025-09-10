
import {BookData} from '@/types/book.ts';
import BookCardContent from '@/components/BookCard/BookCardContent.tsx';

type Props = {
  book: BookData | null;
  isNoHave?: boolean;
};

export default function BookCard(props: Props) {
  return (
    <div className="flex gap-3 items-center justify-center relative">
      <BookCardContent {...props} />
    </div>
  );
}
