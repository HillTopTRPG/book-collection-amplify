
import {BookData} from '@/types/book.ts';
import BookCardContent from '@/components/BookCard/BookCardContent.tsx';

type Props = {
  book: BookData | null;
};

export default function BookCard({ book }: Props) {
  return (
    <div className="flex gap-3 items-center justify-center">
      <BookCardContent book={book} />
    </div>
  );
}
