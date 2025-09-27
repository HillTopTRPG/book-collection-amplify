import { useEffect } from 'react';
import { useSwiper } from 'swiper/react';

type Props = {
  value: boolean;
};

export default function SwipeResolver({ value }: Props) {
  const swiper = useSwiper();

  useEffect(() => {
    swiper.slideTo(value ? 0 : 1);
  }, [swiper, value]);

  return null;
}
