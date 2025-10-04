import type { CollectionBook, Isbn13 } from '@/types/book.ts';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCardNavi from '@/components/BookCardNavi.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { setBookDialogValue } from '@/store/uiSlice.ts';

type Props = {
  isbn: Isbn13;
  collectionBook: CollectionBook | null;
};

export default function ScanResultItem({ isbn, collectionBook }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    console.log(isbn);
    void navigate(`/book/${isbn}`);
  }, [navigate, isbn]);

  const handleOpenDetail = useCallback(() => {
    dispatch(setBookDialogValue(collectionBook));
  }, [dispatch, collectionBook]);

  return <BookCardNavi collectionBook={collectionBook} onClick={handleClick} onOpenBook={handleOpenDetail} />;
}
