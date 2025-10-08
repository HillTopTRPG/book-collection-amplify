import { type ComponentProps, memo, useMemo } from 'react';
import BookCard from '@/components/Card/BookCard.tsx';
import BookStatusSelector from './BookStatusSelector.tsx';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

type Props = ComponentProps<typeof BookCard>;

const BookCardNavi = (props: Props) =>
  useMemo(
    () => (
      <div className="relative flex h-fit w-full overflow-hidden">
        <BookStatusSelector collectionBook={props.collectionBook} />
        <BookCard
          className="pl-8"
          style={{
            maxWidth: 'calc(100% - 0.5rem)',
            minWidth: 'calc(100% - 0.5rem)',
          }}
          {...props}
        />
      </div>
    ),
    [props]
  );

export default memo(BookCardNavi);
