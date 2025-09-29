import type { BookStatus } from '@/store/subscriptionDataSlice.ts';
import { useState } from 'react';
import NdlCardStatus from '@/pages/ScannedBookPage/FilterBlock/NdlCardStatus.tsx';
import { BookStatusLabelMap } from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';

const OPTIONS = getKeys(BookStatusLabelMap).map(key => ({ ...BookStatusLabelMap[key], val: key }));

type Props = {
  value: BookStatus;
  setValue: (value: BookStatus) => void;
};

export default function NdlCardStatusSelector({ value, setValue }: Props) {
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
    <>
      <NdlCardStatus isFirst {...current} zIndex={OPTIONS.length} onClick={toEdit} />
      {editing
        ? OPTIONS.filter(({ val }) => val !== value).map((item, idx) => (
            <NdlCardStatus key={idx} {...item} zIndex={OPTIONS.length - idx - 1} onClick={onSetValue(item.val)} />
          ))
        : null}
    </>
  );
}
