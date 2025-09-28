import type { BookData } from '@/types/book.ts';
import type { ComponentProps } from 'react';
import { ChevronsRight } from 'lucide-react';
import { useId, useState } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import ToggleSwiper from '@/components/ToggleSwiper';
import { cn } from '@/lib/utils.ts';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

const TRUE_COLOR = 'bg-blue-500 text-white';

type Props = ComponentProps<typeof NdlCard> & {
  idx: number;
  books: BookData[];
};

export default function NdlCardNavi(props: Props) {
  const [value, setValue] = useState(false);
  const uuid = useId();

  const trueContent = (
    <div
      className={cn(TRUE_COLOR, 'flex items-center justify-center h-full text-xs pl-2 mr-[-24px] font-medium')}
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
