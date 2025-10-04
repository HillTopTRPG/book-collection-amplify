import type { CollectionBook, Isbn13 } from '@/types/book.ts';
import { useCallback } from 'react';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';

type Props = {
  isbn: Isbn13;
  collectionBook: CollectionBook | null;
};

export default function ScanResultItem({ isbn, collectionBook }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigateWithLoading();

  const handleClick = useCallback(() => {
    console.log(isbn);
    navigate(`/book/${isbn}`);
  }, [navigate, isbn]);

  const handleOpenDetail = useCallback(() => {
    dispatch(setBookDialogValue(collectionBook));
  }, [dispatch, collectionBook]);

  return <BookCardNavi collectionBook={collectionBook} onClick={handleClick} onOpenBook={handleOpenDetail} />;
}
