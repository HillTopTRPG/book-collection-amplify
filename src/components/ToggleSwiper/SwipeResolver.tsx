import { useEffect } from 'react';
import { useSwiper } from 'swiper/react';

type Props = {
  value: number;
  plusLength: number;
};

export default function SwipeResolver({ value, plusLength }: Props) {
  const swiper = useSwiper();

  useEffect(() => {
    swiper.slideTo(plusLength - value);
  }, [plusLength, swiper, value]);

  return null;
}
