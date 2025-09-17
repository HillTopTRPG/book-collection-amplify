import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import NdlCardItem from '@/components/Card/NdlCard/NdlCardItem.tsx';
import type { NdlOptions, NdlResponse } from '@/utils/fetch.ts';

type Props = {
  ndl: Partial<NdlResponse>;
  options: NdlOptions;
  anywhere: string;
};

export default function NdlCard({ ndl, options, anywhere }: Props) {
  const isbn = ndl.isbn?.replaceAll('-', '');

  return (
    <CardFrame className="items-start">
      <BookImage isbn={isbn} defaultUrl={null} />
      <div className="flex items-baseline flex-wrap gap-x-3">
        <div className="w-full flex items-baseline flex-wrap gap-x-3">
          <NdlCardItem value={ndl?.title} highLight={anywhere} className="text-lg font-bold inline-block" />
          <NdlCardItem value={ndl?.volume} highLight={anywhere} className="text-lg font-bold" />
          <NdlCardItem value={ndl?.volumeTitle} highLight={anywhere} className="text-lg font-bold" />
        </div>
        <div className="w-full flex items-baseline flex-wrap gap-x-3">
          { options.creator ? null : <NdlCardItem value={ndl?.creator?.join(', ')} highLight={anywhere} className="text-xs" /> }
          { options.publisher ? null : <NdlCardItem value={ndl?.publisher} highLight={anywhere} className="text-xs" /> }
        </div>
        <NdlCardItem value={ndl?.edition} highLight={anywhere} className="text-xs" />
        <NdlCardItem value={ndl?.date} highLight={anywhere} label="発売日" className="text-xs" />
        <NdlCardItem value={ndl?.ndc} highLight={anywhere} label="分類" className="text-xs" />
        <NdlCardItem value={ndl?.seriesTitle} label="シリーズ" highLight={anywhere} className="text-xs" />
        <NdlCardItem value={ndl?.isbn?.replaceAll('-', '')} label="ISBN" highLight={anywhere} className="w-full text-xs text-gray-400" />
      </div>
    </CardFrame>
  );
}
