import type { PickRequired } from '@/utils/type.ts';
import { useParams } from 'react-router-dom';
import Contents from '@/pages/ScannedBookPage/Contents.tsx';
import { useAppSelector } from '@/store/hooks.ts';
import { selectScanResultList } from '@/store/scannerSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';

export default function ScannedBookPage() {
  const { maybeIsbn: raw } = useParams<{ maybeIsbn: string }>();
  const maybeIsbn = getIsbnCode(raw);
  const scanResultList = useAppSelector(selectScanResultList);

  if (!maybeIsbn) {
    return <div>ISBNコードを指定してください。</div>;
  }

  const content = (() => {
    if (!maybeIsbn) {
      return <div>ISBNコードを指定してください。</div>;
    }
    const isbn = getIsbn13(maybeIsbn);
    const selected = scanResultList.find(item => item.isbn === isbn);
    if (!selected) {
      return <div>ISBNコードを指定してください。</div>;
    }
    if (selected.status !== 'done' || !selected.result?.bookDetail) {
      return <div>読み込み中...</div>;
    }
    return <Contents scannedItemMapValue={selected.result as PickRequired<typeof selected.result, 'bookDetail'>} />;
  })();

  return <div className="flex flex-col w-full flex-1 gap-4">{content}</div>;
}
