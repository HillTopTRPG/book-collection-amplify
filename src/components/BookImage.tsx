import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useInView } from '@/hooks/useInView.ts';
import { enqueueBookImage, selectFetchBookImageQueueResults } from '@/store/fetchBookImageSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';
import type { Isbn13 } from '@/types/book.ts';

type Props = {
  isbn: Isbn13 | null | undefined;
  size?: 'small' | 'big';
  onClick?: () => void;
};

export default function BookImage({ isbn, size, onClick }: Props) {
  const dispatch = useDispatch();
  const fetchBookImageQueueResults = useAppSelector(selectFetchBookImageQueueResults);
  const [imageUrl, setImageUrl] = useState<{ status: 'loading' | 'retrying' | 'done'; url: string | null }>({
    status: 'loading',
    url: null,
  });

  const { ref, inView } = useInView({ threshold: 0.2, once: false });

  useEffect(() => {
    if (inView && isbn) {
      dispatch(enqueueBookImage({ type: 'priority', list: [isbn] }));
    }
  }, [dispatch, inView, isbn]);

  const width = size === 'big' ? 150 : 50;
  const height = size === 'big' ? 225 : 75;

  useEffect(() => {
    if (!isbn) return;
    setImageUrl({ status: 'loading', url: null });
  }, [dispatch, isbn]);

  useEffect(() => {
    if (!isbn) return;
    const url = fetchBookImageQueueResults[isbn];
    if (url !== undefined && imageUrl.status !== 'done') {
      if (url === 'retrying') {
        setImageUrl({ url: null, status: 'retrying' });
      } else {
        setImageUrl({ url, status: 'done' });
      }
    }
  }, [fetchBookImageQueueResults, imageUrl.status, isbn]);

  const content = (() => {
    if (!imageUrl.url) {
      return imageUrl.status !== 'done' ? <Spinner variant="bars" /> : <ImageOff />;
    }
    return (
      <img
        src={imageUrl.url}
        alt="表紙"
        className="rounded border"
        style={{ objectFit: 'cover', width, height }}
        onClick={onClick}
      />
    );
  })();

  return (
    <div
      ref={ref}
      className="min-w-[50px] min-h-[75px] rounded border flex items-center justify-center"
      onClick={onClick}
      style={{ minWidth: width, minHeight: height }}
    >
      {content}
    </div>
  );
}
