import type { BookData } from '@/types/book.ts';
import type { ComponentProps } from 'react';
import { useEffect, useId, useState } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import NdlCardStatusSelector from '@/pages/ScannedBookPage/FilterBlock/NdlCardStatusSelector.tsx';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

type Props = ComponentProps<typeof NdlCard> & {
  idx: number;
  books: BookData[];
};

export default function NdlCardNavi(props: Props) {
  const [value, setValue] = useState(0);
  const uuid = useId();

  useEffect(() => {
    console.log('NdlCardNavi', value);
  }, [value]);

  return (
    <div id={uuid} className="relative">
      <div
        className="absolute inset-0 bg-indigo-900"
        style={{ opacity: 0.2 + (props.idx / props.books.length) * 0.6 }}
      />
      <div className="relative flex h-full w-full">
        <NdlCardStatusSelector value={value} setValue={setValue} />
        <NdlCard className="pl-8" {...props} />
      </div>
    </div>
  );
}
