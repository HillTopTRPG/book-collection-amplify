import type { CollectionBook } from '@/types/book.ts';
import { useMemo } from 'react';
import Barcode from 'react-barcode';
import BookImage from '@/components/BookImage.tsx';
import { getIsbn10, getIsbn13, getIsbnWithHyphen } from '@/utils/isbn.ts';

type Props = {
  collectionBook: CollectionBook;
  excludeProperties?: (keyof CollectionBook)[];
};

export default function BookDialogContent({ collectionBook, excludeProperties }: Props) {
  const isbn = collectionBook.isbn;

  const tableData = useMemo(
    () =>
      [
        !excludeProperties?.includes('seriesTitle') && { name: 'シリーズ', value: collectionBook.seriesTitle },
        ...(!excludeProperties?.includes('creator')
          ? (collectionBook.creator?.map((c, idx, self) => ({
              name: `著者${self.length === 1 ? '' : idx + 1}`,
              value: c,
            })) ?? [])
          : []),
        !excludeProperties?.includes('publisher') && { name: '出版社', value: collectionBook.publisher },
        !excludeProperties?.includes('date') && { name: '発売日', value: collectionBook.date },
        !excludeProperties?.includes('ndc') && { name: '分類コード', value: collectionBook.ndc },
        ...(!excludeProperties?.includes('ndcLabels')
          ? collectionBook.ndcLabels.map((ndcl, idx) => ({ name: `分類${idx + 1}`, value: ndcl }))
          : []),
        !excludeProperties?.includes('edition') && { name: 'エディション', value: collectionBook.edition },
        !excludeProperties?.includes('extent') && { name: '商品形態', value: collectionBook.extent },
        !excludeProperties?.includes('isbn') && { name: 'ISBN(10)', value: getIsbnWithHyphen(isbn, 10) },
        !excludeProperties?.includes('isbn') && { name: '', value: getIsbn10(isbn) },
        !excludeProperties?.includes('isbn') && { name: 'ISBN(13)', value: getIsbnWithHyphen(isbn, 13) },
        !excludeProperties?.includes('isbn') && { name: '', value: getIsbn13(isbn) },
      ].filter((data): data is { name: string; value: string } => Boolean(data)),
    [
      collectionBook.creator,
      collectionBook.date,
      collectionBook.edition,
      collectionBook.extent,
      collectionBook.ndc,
      collectionBook.ndcLabels,
      collectionBook.publisher,
      collectionBook.seriesTitle,
      excludeProperties,
      isbn,
    ]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <BookImage isbn={isbn} size="big" />
      <div className="flex flex-col gap-1">
        {tableData.map((rowData, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="text-right text-xs w-[5rem]">{rowData.name}</div>
            <div className="text-left flex-1 text-xs">{rowData.value || '-'}</div>
          </div>
        ))}
      </div>
      <Barcode value={collectionBook.isbn} format="EAN13" width={2} height={40} />
      {excludeProperties?.includes('isbn') ? (
        <div className="text-xs">
          {getIsbn10(isbn)} / {getIsbn13(isbn)}
        </div>
      ) : null}
    </div>
  );
}
