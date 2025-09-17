import BookImage from '@/components/BookImage.tsx';
import CardFrame from '@/components/Card/CardFrame.tsx';
import HighLightText from '@/components/Card/NdlCard/HighLightText.tsx';
import NdlCardItem from '@/components/Card/NdlCard/NdlCardItem.tsx';
import type { NdlOptions, NdlResponse } from '@/utils/fetch.ts';

type Props = {
  ndl: Partial<NdlResponse>;
  options: NdlOptions;
};

export default function NdlCard({ ndl, options }: Props) {
  const isbn = ndl.isbn?.replaceAll('-', '');

  return (
    <CardFrame className="items-start">
      <BookImage isbn={isbn} defaultUrl={null} />
      <div className="flex flex-wrap gap-x-3">
        <div className="w-full flex flex-wrap gap-x-3">
          <NdlCardItem value={ndl?.title} className="text-lg font-bold inline-block">
            {(title) => <HighLightText value={title} subStr={options.title || ''} subClassName="bg-yellow-900" />}
          </NdlCardItem>
          <NdlCardItem value={ndl?.volume} className="text-lg font-bold" />
          <NdlCardItem value={ndl?.volumeTitle} className="text-lg font-bold" />
        </div>
        <div className="w-full flex flex-wrap gap-x-3">
          { options.creator ? null : <NdlCardItem value={ndl?.creator?.join(', ')} /> }
          { options.publisher ? null : <NdlCardItem value={ndl?.publisher} /> }
        </div>
        <NdlCardItem value={ndl?.edition} />
        <NdlCardItem value={ndl?.date} label="発売日" />
        <NdlCardItem value={ndl?.ndc} label="分類" />
        <NdlCardItem value={ndl?.isbn} label="ISBN" className="text-xs text-gray-400" />
        <NdlCardItem value={ndl?.seriesTitle} label="シリーズ" className="text-sm text-gray-400" />
      </div>
    </CardFrame>
  );
}
