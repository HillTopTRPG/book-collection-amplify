import type { ComponentProps } from 'react';
import BookCard from '@/components/Card/BookCard.tsx';
import BookStatusSelector from './BookStatusSelector.tsx';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

type Props = ComponentProps<typeof BookCard>;

export default function BookCardNavi(props: Props) {
  return (
    <div className="relative flex h-fit w-full overflow-hidden">
      <BookStatusSelector bookDetail={props.bookDetail} />
      <BookCard
        className="pl-8"
        style={{
          maxWidth: 'calc(100% - 1.5rem)',
          minWidth: 'calc(100% - 1.5rem)',
        }}
        {...props}
      />
    </div>
  );
}
