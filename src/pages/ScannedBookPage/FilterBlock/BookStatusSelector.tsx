import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import useIdInfo from '@/store/hooks/useIdInfo.ts';
import {
  BookStatusEnum,
  BookStatusLabelMap,
  deleteTraceNotify,
  selectTraceNotify,
} from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';
import BookStatusParts from './BookStatusParts.tsx';

const OPTIONS = getKeys(BookStatusLabelMap).map(key => ({ ...BookStatusLabelMap[key], val: key }));

type Props = {
  bookDetail: BookDetail | null;
};

export default function BookStatusSelector({ bookDetail }: Props) {
  const dispatch = useAppDispatch();
  const { getCollectionByIdInfo } = useIdInfo();
  const { createCollections, updateCollections, deleteCollections } = useAwsAccess();
  const traceNotify = useAppSelector(selectTraceNotify);
  const [traceIdList, setTraceIdList] = useState<string[]>([]);
  const collection = bookDetail ? getCollectionByIdInfo(bookDetail.collection) : null;
  const value = collection?.meta.status ?? BookStatusEnum.Unregistered;
  const [editing, setEditing] = useState(false);
  const toEdit = () => {
    setEditing(!editing);
  };
  const onSetValue = (value: BookStatus) => () => {
    setEditing(false);
    setValue(value);
  };
  const current = OPTIONS.find(op => op.val === value);

  useEffect(() => {
    const deleteList = traceIdList.filter(traceId => traceNotify.some(tn => tn === traceId));
    if (!deleteList.length) return;
    dispatch(deleteTraceNotify(deleteList));
    setTraceIdList(prev => prev.filter(id => !deleteList.includes(id)));
  }, [dispatch, traceIdList, traceNotify]);

  const setValue = useCallback(
    (value: BookStatus) => {
      if (!bookDetail || !collection) return;
      const newMeta = structuredClone(collection.meta);
      newMeta.status = value;

      if (value !== BookStatusEnum.Unregistered) {
        if (bookDetail.collection.type === 'db') {
          console.log('# update db collection (meta)');
          const id = bookDetail.collection.id;
          const traceId = updateCollections(id, newMeta);
          console.log('traceId ', traceId);
          setTraceIdList(prev => [...prev, traceId]);
        } else {
          console.log('# create db collection (meta)');
          const isbn = bookDetail.book.isbn;
          const traceId = createCollections(isbn, newMeta);
          console.log('traceId ', traceId);
          setTraceIdList(prev => [...prev, traceId]);
        }
        return;
      } else {
        console.log('# delete db collection (meta)');
        const id = bookDetail.collection.id;
        const traceId = deleteCollections(id);
        console.log('traceId ', traceId);
        setTraceIdList(prev => [...prev, traceId]);
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
        label={traceIdList.length ? <Spinner variant="bars" /> : current.label}
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
                <BookStatusParts {...item} zIndex={10 - idx} onClick={onSetValue(item.val)} />
              </motion.div>
            ))
          : null}
      </AnimatePresence>
    </motion.div>
  );
}
