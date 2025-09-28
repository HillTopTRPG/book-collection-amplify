import { useState } from 'react';
import NdlCardStatus from '@/pages/ScannedBookPage/FilterBlock/NdlCardStatus.tsx';

const OPTIONS = [
  { val: 0, text: '未登録', className: 'bg-yellow-700 text-white' },
  { val: 1, text: '買わない', className: 'bg-gray-700 text-white' },
  { val: 2, text: '保留', className: 'bg-green-700 text-white' },
  { val: 3, text: '購入予定', className: 'bg-fuchsia-900 text-white' },
  { val: 4, text: '所持済', className: 'bg-blue-600 text-white' },
] as const;

type Props = {
  value: number;
  setValue: (value: number) => void;
};

export default function NdlCardStatusSelector({ value, setValue }: Props) {
  const [editing, setEditing] = useState(false);
  const toEdit = () => {
    setEditing(!editing);
  };
  const onSetValue = (value: number) => () => {
    setEditing(false);
    setValue(value);
  };
  const current = OPTIONS[value];

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
