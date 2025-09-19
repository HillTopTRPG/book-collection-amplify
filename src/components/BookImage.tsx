import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { addGetImageQueue, selectBookImageResults } from '@/store/fetchApiQueueSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';

type Props = {
  isbn: string | null | undefined;
  size?: 'small' | 'big';
  onClick?: () => void;
};

export default function BookImage({ isbn, size, onClick }: Props) {
  const dispatch = useDispatch();
  const bookImageResults = useAppSelector(selectBookImageResults);
  const [imageUrl, setImageUrl] = useState<{ status: 'loading' | 'retrying' | 'done'; url: string | null }>({
    status: 'loading',
    url: null,
  });

  const width = size === 'big' ? 150 : 50;
  const height = size === 'big' ? 225 : 75;

  useEffect(() => {
    if (!isbn) return;
    setImageUrl({ status: 'loading', url: null });
    dispatch(addGetImageQueue(isbn));
  }, [dispatch, isbn]);

  useEffect(() => {
    if (!isbn) return;
    const url = bookImageResults.get(isbn);
    if (url !== undefined && imageUrl.status !== 'done') {
      if (url === 'retrying') {
        setImageUrl({ url: null, status: 'retrying' });
      } else {
        setImageUrl({ url, status: 'done' });
      }
    }
  }, [bookImageResults, imageUrl.status, isbn]);

  return imageUrl.url ? (
    <img
      src={imageUrl.url}
      alt="表紙"
      className="rounded border"
      style={{ objectFit: 'cover', width, height }}
      onClick={onClick}
    />
  ) : (
    <div
      className="min-w-[50px] min-h-[75px] rounded border flex items-center justify-center"
      onClick={onClick}
      style={{ minWidth: width, minHeight: height }}
    >
      {imageUrl.status !== 'done' ? <Spinner variant="bars" /> : <ImageOff />}
    </div>
  );
}
