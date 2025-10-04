import type { Isbn13 } from '@/types/book.ts';
import type { ClassValue } from 'clsx';
import type { MouseEvent } from 'react';
import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useInView } from '@/hooks/useInView.ts';
import { cn } from '@/lib/utils.ts';
import { enqueueBookImage, selectFetchBookImageQueueResults } from '@/store/fetchBookImageSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';

const SIZE: Record<'small' | 'big' | 'default', { width: number; height: number }> = {
  default: {
    width: 50,
    height: 75,
  },
  big: {
    width: 150,
    height: 225,
  },
  small: {
    width: 30,
    height: 45,
  },
};

type Props = {
  isbn: Isbn13 | null | undefined;
  size?: 'small' | 'default' | 'big';
  onClick?: (e: MouseEvent) => void;
};

export default function BookImage({ isbn, size = 'default', onClick }: Props) {
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

  const { width, height } = SIZE[size];

  useEffect(() => {
    if (!isbn) return;
    setImageUrl({ status: 'loading', url: null });
  }, [dispatch, isbn]);

  useEffect(() => {
    if (!isbn) return;
    const url: string | null | undefined =
      isbn in fetchBookImageQueueResults ? fetchBookImageQueueResults[isbn] : undefined;
    if (url !== undefined && imageUrl.status !== 'done') {
      if (url === 'retrying') {
        setImageUrl({ url: null, status: 'retrying' });
      } else {
        setImageUrl({ url, status: 'done' });
      }
    }
  }, [fetchBookImageQueueResults, imageUrl.status, isbn]);

  const cursorClass: ClassValue = onClick ? 'cursor-pointer' : 'cursor-default';

  const content = (() => {
    if (!imageUrl.url) {
      return imageUrl.status !== 'done' ? <Spinner variant="bars" /> : <ImageOff />;
    }
    return (
      <img
        src={imageUrl.url}
        alt="表紙"
        className={cn('select-none', cursorClass)}
        style={{ objectFit: 'cover', width, height }}
        onClick={onClick}
        draggable="false"
      />
    );
  })();

  return (
    <div
      ref={ref}
      className={cn(
        'min-w-[50px] min-h-[75px] bg-gradient-to-tr from-pink-300 via-red-300 to-orange-300 flex items-center justify-center',
        cursorClass
      )}
      onClick={onClick}
      style={{ minWidth: width, maxWidth: width, minHeight: height, maxHeight: height }}
    >
      {content}
    </div>
  );
}
