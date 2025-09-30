import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import type { ComponentProps } from 'react';
import { generateClient } from 'aws-amplify/data';
import BookCard from '@/components/Card/BookCard.tsx';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { BookStatusEnum } from '@/store/subscriptionDataSlice.ts';
import NdlCardStatusSelector from './NdlCardStatusSelector.tsx';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

type Props = ComponentProps<typeof BookCard> & {
  idx: number;
  bookDetails: BookDetail[];
};

export default function NdlCardNavi(props: Props) {
  const { getCollectionByIdInfo } = useIdInfo();
  const collection = props.bookDetail ? getCollectionByIdInfo(props.bookDetail.collection) : null;
  const value = collection?.meta.status ?? BookStatusEnum.Unregistered;

  const setValue = (value: BookStatus) => {
    if (!props.bookDetail || !collection) return;
    const newMeta = structuredClone(collection.meta);
    newMeta.status = value;

    if (value !== BookStatusEnum.Unregistered) {
      if (props.bookDetail.collection.type === 'db') {
        console.log('# update db collection (meta)');
        userPoolClient.models.Collection.update({
          id: props.bookDetail.collection.id,
          meta: JSON.stringify(newMeta),
        });
      } else {
        console.log('# create db collection (meta)');
        userPoolClient.models.Collection.create({
          isbn: props.bookDetail.book.isbn,
          meta: JSON.stringify(newMeta),
        });
      }
      return;
    } else {
      console.log('# delete db collection (meta)');
      userPoolClient.models.Collection.delete({ id: props.bookDetail.collection.id });
      return;
    }
  };

  return (
    <div className="relative flex h-full w-full">
      <NdlCardStatusSelector value={value} setValue={setValue} />
      <BookCard className="pl-8" {...props} />
    </div>
  );
}
