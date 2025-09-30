import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { BookStatusLabelMap } from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';
import BookStatusParts from './BookStatusParts.tsx';

const OPTIONS = getKeys(BookStatusLabelMap).map(key => ({ ...BookStatusLabelMap[key], val: key }));

type Props = {
  value: BookStatus;
  setValue: (value: BookStatus) => void;
};

export default function BookStatusSelector({ value, setValue }: Props) {
  const [editing, setEditing] = useState(false);
  const toEdit = () => {
    setEditing(!editing);
  };
  const onSetValue = (value: BookStatus) => () => {
    setEditing(false);
    setValue(value);
  };
  const current = OPTIONS.find(op => op.val === value);
  if (!current) return null;

  return (
    <motion.div
      className="flex relative"
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <BookStatusParts isFirst {...current} zIndex={100} onClick={toEdit} />
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
