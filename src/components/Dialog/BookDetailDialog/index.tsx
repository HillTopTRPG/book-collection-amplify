import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectBookDetailDialogValue, setBookDetailDialogValue } from '@/store/uiSlice.ts';
import BookDetailDialogContent from './BookDetailDialogContent.tsx';

export default function BookDetailDialog() {
  const dispatch = useAppDispatch();
  const bookDetail = useAppSelector(selectBookDetailDialogValue);
  const onClose = () => {
    dispatch(setBookDetailDialogValue(null));
  };
  const book = bookDetail?.book;

  return (
    <Dialog open={Boolean(book)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90svh] overflow-scroll z-[1001]">
        <DialogHeader>
          <DialogTitle>
            {book?.title} {book?.volume || book?.volumeTitle}
          </DialogTitle>
          <DialogDescription>書籍の詳細情報を表示します</DialogDescription>
        </DialogHeader>
        {book ? <BookDetailDialogContent book={book} /> : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button>閉じる</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
