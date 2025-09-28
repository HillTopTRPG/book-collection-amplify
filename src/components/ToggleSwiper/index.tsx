import type { ReactNode } from 'react';
import { Mousewheel, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwipeResolver from './SwipeResolver.tsx';

import 'swiper/css';
import 'swiper/css/navigation';

type Props = {
  value: boolean;
  setValue: (value: boolean) => void;
  trueContent: ReactNode;
  children: ReactNode;
  scrollParentId: string;
};

export default function ToggleSwiper({ value, setValue, trueContent, children, scrollParentId }: Props) {
  return (
    <Swiper
      initialSlide={value ? 0 : 1}
      slidesPerView="auto"
      pagination={true}
      direction="horizontal"
      grabCursor
      slideToClickedSlide
      preventClicks={false}
      preventClicksPropagation={false}
      modules={[Navigation, Mousewheel]}
      mousewheel={{
        eventsTarget: `#${scrollParentId}`,
        forceToAxis: true,
      }}
      className="w-full h-full"
      onSlideChange={swiper => {
        setValue(!swiper.activeIndex);
      }}
    >
      <SwiperSlide className="w-fit z-10">
        <SwipeResolver value={value} />
        {trueContent}
      </SwiperSlide>
      <SwiperSlide>{children}</SwiperSlide>
    </Swiper>
  );
}
