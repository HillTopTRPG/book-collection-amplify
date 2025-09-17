import { useEffect, useState } from 'react';

import { ImageOff } from 'lucide-react';
import { useDispatch } from 'react-redux';

import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { addGetImageQueue, selectBookImageResults } from '@/store/fetchApiQueueSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';

type Props = {
  defaultUrl: string | null | undefined;
  isbn: string | null | undefined;
};

export default function BookImage({ defaultUrl, isbn }: Props) {
  const dispatch = useDispatch();
  const bookImageResults = useAppSelector(selectBookImageResults);
  const [imageUrl, setImageUrl] = useState<{ status: 'loading' | 'done'; url: string | null }>({ status: 'loading', url: null });

  useEffect(() => {
    if (!isbn) return;
    setImageUrl({ status: 'loading', url: null });
    dispatch(addGetImageQueue({ defaultUrl: defaultUrl ?? `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`, isbn }));
  }, [defaultUrl, dispatch, isbn]);

  useEffect(() => {
    if (!isbn || imageUrl.status !== 'loading') return;
    const url = bookImageResults.get(isbn);
    if (url !== undefined) {
      setImageUrl({ status: 'done', url });
    }
  }, [bookImageResults, imageUrl.status, isbn]);

  return imageUrl.url
    ? <img src={imageUrl.url} alt="表紙" className="w-[50px] h-[75px] rounded border" style={{ objectFit: 'cover' }} />
    : <div className="min-w-[50px] min-h-[75px] rounded border flex items-center justify-center">
      {imageUrl.status === 'loading' ? <Spinner variant="bars" /> : <ImageOff />}
    </div>;
}
