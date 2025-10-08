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
import { selectBookDialogValue, setBookDialogValue } from '@/store/uiSlice.ts';
import BookDialogContent from './BookDialogContent.tsx';

export default function BookDialog() {
  const dispatch = useAppDispatch();
  const collectionBook = useAppSelector(selectBookDialogValue);
  const handleClose = () => {
    dispatch(setBookDialogValue(null));
  };

  return (
    <Dialog open={Boolean(collectionBook)} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[100svh] overflow-scroll z-[1001]">
        <DialogHeader>
          <DialogTitle>
            {collectionBook?.title} {collectionBook?.volume || collectionBook?.volumeTitle}
          </DialogTitle>
          <DialogDescription>書籍の詳細情報を表示します</DialogDescription>
        </DialogHeader>
        {collectionBook ? <BookDialogContent collectionBook={collectionBook} /> : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button>閉じる</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
