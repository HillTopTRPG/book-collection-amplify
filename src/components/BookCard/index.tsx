import { useCallback } from 'react';

import BookCardContent from '@/components/BookCard/BookCardContent.tsx';
import { openDrawer } from '@/store/bookDetailSlice.ts';
import { useAppDispatch } from '@/store/hooks.ts';
import type { BookData } from '@/types/book.ts';

type Props = {
  book: BookData | null;
  isNoHave?: boolean;
  isAlreadyHave?: boolean;
};

export default function BookCard(props: Props) {
  const dispatch = useAppDispatch();

  const onClick = useCallback(() => {
    if (!props.book) return;
    dispatch(openDrawer(props.book.isbn));
  }, [props.book, dispatch]);

  return (
    <div
      className="flex gap-3 items-center justify-center relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors duration-200"
      onClick={onClick}
    >
      <BookCardContent {...props} />
    </div>
  );
}
