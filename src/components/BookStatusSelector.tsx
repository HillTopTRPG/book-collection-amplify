import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppSelector } from '@/store/hooks.ts';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import { BookStatusEnum, BookStatusLabelMap, selectUpdatingCollectionIsbnList } from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';
import BookStatusParts from './BookStatusParts.tsx';

const OPTIONS = getKeys(BookStatusLabelMap).map(key => ({ ...BookStatusLabelMap[key], val: key }));

type Props = {
  bookDetail: BookDetail | null;
};

export default function BookStatusSelector({ bookDetail }: Props) {
  const { getCollectionByIdInfo } = useIdInfo();
  const { createCollections, updateCollections, deleteCollections } = useAwsAccess();
  const updatingCollectionIsbnList = useAppSelector(selectUpdatingCollectionIsbnList);
  const collection = bookDetail ? getCollectionByIdInfo(bookDetail.collection) : null;
  const value = collection?.status ?? BookStatusEnum.Unregistered;
  const [editing, setEditing] = useState(false);
  const toEdit = () => {
    setEditing(!editing);
  };
  const handleSetValue = (value: BookStatus) => () => {
    setEditing(false);
    setValue(value);
  };
  const current = OPTIONS.find(op => op.val === value);

  const setValue = useCallback(
    async (status: BookStatus) => {
      if (!bookDetail || !collection) return;

      const isbn = bookDetail.book.isbn;

      if (status !== BookStatusEnum.Unregistered) {
        if (bookDetail.collection.type === 'db') {
          console.log('# update db collection (meta)');
          const id = bookDetail.collection.id;
          await updateCollections({ id, isbn, status });
        } else {
          console.log('# create db collection (meta)');
          await createCollections({ isbn, status });
        }
        return;
      } else {
        console.log('# delete db collection (meta)');
        const id = bookDetail.collection.id;
        await deleteCollections({ id, isbn });
        return;
      }
    },
    [bookDetail, collection, createCollections, deleteCollections, updateCollections]
  );

  if (!current) return null;

  return (
    <motion.div
      className="flex relative"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <BookStatusParts
        isFirst
        {...current}
        label={
          updatingCollectionIsbnList.some(isbn => isbn === bookDetail?.book.isbn) ? (
            <Spinner variant="bars" />
          ) : (
            current.label
          )
        }
        zIndex={100}
        onClick={toEdit}
      />
      <AnimatePresence>
        {editing
          ? OPTIONS.filter(({ val }) => val !== value).map((item, idx) => (
              <motion.div
                key={item.val}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                  zIndex: 99 - idx,
                  position: 'relative',
                }}
              >
                <BookStatusParts {...item} zIndex={10 - idx} onClick={handleSetValue(item.val)} />
              </motion.div>
            ))
          : null}
      </AnimatePresence>
    </motion.div>
  );
}
