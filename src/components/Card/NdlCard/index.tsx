import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import NdlCardItem from '@/components/Card/NdlCard/NdlCardItem.tsx';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';
import type { BookData } from '@/types/book.ts';

type Props = {
  ndl: BookData;
  options: NdlFullOptions | null | undefined;
  anywhere?: string;
};

export default function NdlCard({ ndl, options, anywhere }: Props) {
  const isbn = ndl.isbn?.replaceAll('-', '');

  const isViewTitle = options?.title !== ndl.title;
  const creatorText = ndl.creator?.join(', ') ?? '';
  const isViewCreator = !options?.useCreator && options?.creator !== creatorText;
  const isViewPublisher = !options?.usePublisher && options?.publisher !== ndl.publisher;

  return (
    <CardFrame className="items-start">
      <BookImage isbn={isbn} defaultUrl={null} />
      <div className="flex items-baseline flex-wrap gap-x-3 flex-1">
        <div className="w-full flex items-baseline flex-wrap gap-x-3">
          { isViewTitle ? (
            <NdlCardItem value={ndl.title} highLight={anywhere} className="text-lg font-bold inline-block" />
          ) : null }
          <NdlCardItem value={ndl.volume} highLight={anywhere} className="text-lg font-bold" />
          <NdlCardItem value={ndl.volumeTitle} highLight={anywhere} className="text-lg font-bold" />
        </div>
        <div className="w-full flex items-baseline flex-wrap gap-x-3">
          { isViewCreator ? <NdlCardItem value={creatorText} highLight={anywhere} className="text-xs" /> : null }
          { isViewPublisher ? <NdlCardItem value={ndl.publisher} highLight={anywhere} className="text-xs" /> : null }
        </div>
        <NdlCardItem value={ndl.edition} highLight={anywhere} className="text-xs" />
        <NdlCardItem value={ndl.date} highLight={anywhere} label="発売日" className="text-xs" />
        <NdlCardItem value={ndl.ndcLabel ?? ndl.ndc} highLight={anywhere} label="分類" className="text-xs" />
        <NdlCardItem value={ndl.seriesTitle} label="シリーズ" highLight={anywhere} className="text-xs" />
        <NdlCardItem value={ndl.isbn?.replaceAll('-', '')} label="ISBN" highLight={anywhere} className="w-full text-xs text-gray-400" />
      </div>
    </CardFrame>
  );
}
