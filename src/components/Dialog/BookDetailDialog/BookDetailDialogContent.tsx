import type { BookData } from '@/types/book.ts';
import Barcode from 'react-barcode';
import BookImage from '@/components/BookImage.tsx';
import { getIsbn10, getIsbn13, getIsbnWithHyphen } from '@/utils/isbn.ts';

type Props = {
  book: BookData;
};

export default function BookDetailDialogContent({ book }: Props) {
  const isbn = book.isbn;

  const tableData = [
    ...(book.creator?.map((c, idx, self) => ({ name: `著者${self.length === 1 ? '' : idx + 1}`, value: c })) ?? []),
    { name: '出版社', value: book.publisher },
    { name: '分類コード', value: book.ndc },
    ...book.ndcLabels.map((ndcl, idx) => ({ name: `分類${idx + 1}`, value: ndcl })),
    { name: 'シリーズ', value: book.seriesTitle },
    { name: 'エディション', value: book.edition },
    { name: '商品形態', value: book.extent },
    { name: 'ISBN(10)', value: getIsbnWithHyphen(isbn, 10) },
    { name: '', value: getIsbn10(isbn) },
    { name: 'ISBN(13)', value: getIsbnWithHyphen(isbn, 13) },
    { name: '', value: getIsbn13(isbn) },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <BookImage isbn={isbn} size="big" />
      <div className="flex flex-col gap-1">
        {tableData.map((rowData, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="text-right text-xs w-[5rem]">{rowData.name}</div>
            <div className="text-left flex-1 text-xs">{rowData.value}</div>
          </div>
        ))}
      </div>
      <Barcode value={book.isbn} format="EAN13" width={2} height={40} />
    </div>
  );
}
