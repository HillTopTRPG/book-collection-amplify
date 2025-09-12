import BookCardContent from '@/components/BookCard/BookCardContent.tsx';
import { BookData } from '@/types/book.ts';

type Props = {
  book: BookData | null;
  isNoHave?: boolean;
  isAlreadyHave?: boolean;
};

export default function BookCard(props: Props) {
  return (
    <div className="flex gap-3 items-center justify-center relative">
      <BookCardContent {...props} />
    </div>
  );
}
