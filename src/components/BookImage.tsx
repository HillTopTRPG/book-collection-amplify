import type { Isbn13 } from '@/types/book.ts';
import type { ClassValue } from 'clsx';
import type { CSSProperties, MouseEvent, SyntheticEvent } from 'react';
import { ImageOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Spinner } from '@/components/ui/shadcn-io/spinner/spinner';
import { useInView } from '@/hooks/useInView.ts';
import { cn } from '@/lib/utils.ts';
import { enqueueBookImage, selectBookImageByIsbn } from '@/store/fetchBookImageSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';

const COLOR: ClassValue = 'bg-gradient-to-tr from-pink-300 via-red-300 to-orange-300';
const CENTER: ClassValue = 'flex items-center justify-center';

const BOOK_IMAGE_SIZE: Record<'small' | 'big' | 'default', { width: number; height: number }> = {
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

// 画像読み込みリトライ設定
const MAX_RETRIES = 3;
const BASE_DELAY = 200; // ms

type Props = {
  isbn: Isbn13 | null | undefined;
  size?: 'small' | 'default' | 'big';
  onClick?: (e: MouseEvent) => void;
};

export default function BookImage({ isbn, size = 'default', onClick }: Props) {
  const dispatch = useDispatch();
  const imageUrl = useAppSelector(state => selectBookImageByIsbn(state, isbn));
  const [view, setView] = useState(false);

  const { ref, inView } = useInView({ threshold: 0.2, once: false });

  // 画像読み込みエラーとリトライ管理
  const retryCount = useRef(0);
  const [hasLoadError, setHasLoadError] = useState(false);

  // imageUrlが変わったらリトライカウントとエラー状態をリセット
  useEffect(() => {
    retryCount.current = 0;
    setHasLoadError(false);
    setView(false);
  }, [imageUrl]);

  // このコンポーネントが表示されたら優先的に書影を取得してもらう
  useEffect(() => {
    if (!inView) return;
    if (!isbn) return;
    setView(true);
    dispatch(enqueueBookImage({ type: 'priority', list: [isbn] }));
  }, [dispatch, inView, isbn]);

  const cursorClass: ClassValue = useMemo(() => (onClick ? 'cursor-pointer' : 'cursor-default'), [onClick]);

  const className = useMemo(() => cn(COLOR, CENTER, cursorClass), [cursorClass]);
  const imgClassName = useMemo(() => cn('select-none', cursorClass), [cursorClass]);

  const handleClick = useCallback((e: MouseEvent) => onClick?.(e), [onClick]);

  // 画像読み込みエラー時のリトライハンドラー（指数バックオフ）
  const handleImageError = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount.current) * BASE_DELAY;
        setTimeout(() => {
          // srcを再設定して再読み込みを試みる
          e.currentTarget.src = imageUrl as string;
          retryCount.current++;
        }, delay);
      } else {
        // 最大リトライ回数に達したらエラー状態に設定
        setHasLoadError(true);
      }
    },
    [imageUrl]
  );

  const { width, height } = useMemo(() => BOOK_IMAGE_SIZE[size], [size]);

  const style: CSSProperties = useMemo(
    () => ({ minWidth: width, maxWidth: width, minHeight: height, maxHeight: height }),
    [height, width]
  );
  const imgStyle = useMemo((): CSSProperties => ({ objectFit: 'cover', width, height }), [height, width]);

  const content = useMemo(() => {
    // 画像読み込みエラーが発生した場合
    if (hasLoadError) {
      return <ImageOff />;
    }

    switch (imageUrl) {
      case 'retrying':
      case undefined:
        return <Spinner variant="bars" />;
      case null:
        return <ImageOff />;
      default:
        // 一度画面内に入ったら画像を読み込む（遅延読み込み）
        return view ? (
          <img
            src={imageUrl}
            alt="表紙"
            className={imgClassName}
            style={imgStyle}
            draggable="false"
            onError={handleImageError}
          />
        ) : (
          <Spinner variant="bars" />
        );
    }
  }, [hasLoadError, imageUrl, view, imgClassName, imgStyle, handleImageError]);

  return (
    <div {...{ ref, className, style }} onClick={handleClick}>
      {content}
    </div>
  );
}
