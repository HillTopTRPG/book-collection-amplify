import type { BookStatus, CollectionBook } from '@/types/book.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Spinner } from '@/components/ui/shadcn-io/spinner/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppSelector } from '@/store/hooks.ts';
import { selectCollectionByApiId, selectUpdatingCollectionApiIdList } from '@/store/subscriptionDataSlice.ts';
import { BookStatusEnum, BookStatusLabelMap } from '@/types/book.ts';
import { getKeys } from '@/utils/type.ts';
import BookStatusParts from './BookStatusParts.tsx';

const OPTIONS = getKeys(BookStatusLabelMap).map(key => ({ ...BookStatusLabelMap[key], val: key }));

type Props = {
  collectionBook: CollectionBook | null;
};

export default function BookStatusSelector({ collectionBook }: Props) {
  const { createCollections, updateCollections, deleteCollections } = useAwsAccess();
  const updatingCollectionApiIdList = useAppSelector(selectUpdatingCollectionApiIdList);
  const collection = useAppSelector(state => selectCollectionByApiId(state, collectionBook?.apiId));
  const value = collection.status;
  const [editing, setEditing] = useState(false);
  const toEdit = () => {
    setEditing(!editing);
  };
  const handleSetValue = (value: BookStatus) => () => {
    setEditing(false);
    void setValue(value);
  };
  const current = OPTIONS.find(op => op.val === value);

  const setValue = useCallback(
    async (status: BookStatus) => {
      if (!collectionBook) return;

      const { apiId } = collectionBook;

      const collectionId = collection.id;
      if (status !== BookStatusEnum.Unregistered) {
        if (collectionId) {
          console.log('# update db collection (meta)');
          await updateCollections({ id: collectionId, apiId, status });
        } else {
          console.log('# create db collection (meta)');
          await createCollections({ apiId, status });
        }
        return;
      } else {
        if (!collectionId) return;

        console.log('# delete db collection (meta)');
        await deleteCollections({ id: collectionId, apiId });
        return;
      }
    },
    [collectionBook, collection, createCollections, deleteCollections, updateCollections]
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
          updatingCollectionApiIdList.some(apiId => apiId === collectionBook?.apiId) ? (
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
