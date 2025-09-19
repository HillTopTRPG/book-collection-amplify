import Barcode from 'react-barcode';
import BookImage from '@/components/BookImage.tsx';
import IsbnTable from '@/components/Drawer/BookDetailDrawer/IsbnTable.tsx';
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
import { getIsbn13 } from '@/utils/primitive.ts';

type Props = {
  book: BookData | null;
  onClose: () => void;
};

export default function BookDetailDialog({ book, onClose }: Props) {
  const barcodeIsbn = (() => {
    const isbn = book?.isbn?.replaceAll('-', '');
    if (!isbn) return null;
    return [10, 13].includes(isbn.length) ? isbn : null;
  })();

  return (
    <Dialog open={Boolean(book)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle>
            {book?.title} {book?.volume || book?.volumeTitle}
          </DialogTitle>
          <DialogDescription>書籍の詳細情報を表示します</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <BookImage isbn={book?.isbn} size="big" />
          {barcodeIsbn && book ? (
            <>
              <IsbnTable book={book} />
              <div className="mt-4">
                <Barcode value={getIsbn13(barcodeIsbn)} format="EAN13" width={2} height={40} />
              </div>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>閉じる</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
