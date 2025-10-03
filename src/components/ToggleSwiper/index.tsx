import type { ReactNode } from 'react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwipeResolver from './SwipeResolver.tsx';

import 'swiper/css';
import 'swiper/css/navigation';

type Props = {
  value: number;
  setValue: (value: number) => void;
  plusContents: ReactNode[];
  minusContents: ReactNode[];
  children: ReactNode;
  scrollParentId: string;
};

export default function ToggleSwiper({ value, setValue, plusContents, children, scrollParentId }: Props) {
  return (
    <Swiper
      initialSlide={0}
      slidesPerView="auto"
      pagination={true}
      direction="horizontal"
      // grabCursor
      slideToClickedSlide
      preventClicks={false}
      preventClicksPropagation={true}
      modules={[Navigation, Mousewheel]}
      mousewheel={{
        eventsTarget: `#${scrollParentId}`,
        forceToAxis: true,
      }}
      className="w-full h-full"
      onSlideChange={swiper => {
        const idx = swiper.activeIndex;
        setValue(plusContents.length - idx);
      }}
    >
      <SwipeResolver plusLength={plusContents.length} value={value} />
      <SwiperSlide className="!w-fit overflow-x-visible z-10"></SwiperSlide>
      <SwiperSlide>{children}</SwiperSlide>
    </Swiper>
  );
}
