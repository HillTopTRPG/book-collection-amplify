import type { ComponentProps } from 'react';
import { useId, useState } from 'react';
import { ChevronsRight } from 'lucide-react';
import NdlCard from '@/components/Card/NdlCard';
import 'swiper/css';
import 'swiper/css/navigation';
import ToggleSwiper from '@/components/ToggleSwiper';
import type { BookData } from '@/types/book.ts';
import '@m_three_ui/m3ripple/css';

type Props = ComponentProps<typeof NdlCard> & {
  idx: number;
  books: BookData[];
};

export default function NdlCardNavi(props: Props) {
  const [value, setValue] = useState(false);
  const uuid = useId();

  const trueContent = (
    <div
      className="flex items-center justify-center h-full text-xs pl-2 mr-[-24px] bg-blue-500 text-white font-medium"
      onMouseDown={() => {
        console.log('clicked');
      }}
    >
      <span>登録対象</span>
      <ChevronsRight />
    </div>
  );

  return (
    <div id={uuid} className="relative">
      <div
        className="absolute inset-0 bg-indigo-900"
        style={{ opacity: 0.2 + (props.idx / props.books.length) * 0.6 }}
      />
      <div className="w-full h-full flex">
        <ToggleSwiper {...{ value, setValue, trueContent }} scrollParentId={uuid}>
          <div className="relative flex h-full w-full pl-[24px] z-10">
            <NdlCard {...props} />
          </div>
        </ToggleSwiper>
      </div>
    </div>
  );
}
