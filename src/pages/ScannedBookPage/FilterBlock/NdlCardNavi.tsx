import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import type { ComponentProps } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useId } from 'react';
import NdlCard from '@/components/Card/NdlCard';
import NdlCardStatusSelector from '@/pages/ScannedBookPage/FilterBlock/NdlCardStatusSelector.tsx';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { BookStatusEnum } from '@/store/subscriptionDataSlice.ts';

import 'swiper/css';
import 'swiper/css/navigation';
import '@m_three_ui/m3ripple/css';

const userPoolClient = generateClient<Schema>({
  authMode: 'userPool',
});

type Props = ComponentProps<typeof NdlCard> & {
  idx: number;
  bookDetails: BookDetail[];
};

export default function NdlCardNavi(props: Props) {
  const { getCollectionByIdInfo } = useIdInfo();
  const collection = getCollectionByIdInfo(props.bookDetail.collection);
  if (props.bookDetail.book.isbn === '9784063197433') {
    console.log(JSON.stringify(props.bookDetail.collection, null, 2));
  }
  const value = collection.meta.status;
  const uuid = useId();

  const setValue = (value: BookStatus) => {
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

  useEffect(() => {
    console.log('NdlCardNavi', value);
  }, [value]);

  return (
    <div id={uuid} className="relative">
      <div
        className="absolute inset-0 bg-indigo-900"
        style={{ opacity: 0.2 + (props.idx / props.bookDetails.length) * 0.6 }}
      />
      <div className="relative flex h-full w-full">
        <NdlCardStatusSelector value={value} setValue={setValue} />
        <NdlCard className="pl-8" {...props} />
      </div>
    </div>
  );
}
