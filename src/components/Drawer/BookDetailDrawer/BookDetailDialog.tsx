import BookDetailContent from '@/components/Drawer/BookDetailDrawer/BookDetailContent.tsx';
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
import type { BookData } from '@/types/book.ts';

type Props = {
  book: BookData | null;
  onClose: () => void;
};

export default function BookDetailDialog({ book, onClose }: Props) {
  return (
    <Dialog open={Boolean(book)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle>
            {book?.title} {book?.volume || book?.volumeTitle}
          </DialogTitle>
          <DialogDescription>書籍の詳細情報を表示します</DialogDescription>
        </DialogHeader>
        {book ? <BookDetailContent book={book} /> : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button>閉じる</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
