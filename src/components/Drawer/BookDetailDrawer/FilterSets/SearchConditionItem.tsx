import ComboInput from '@/components/ComboInput.tsx';
import { useAppDispatch } from '@/store/hooks.ts';
import { updateFetchedFilterAnywhere } from '@/store/scannerSlice.ts';
import type { Isbn13 } from '@/types/book.ts';

type Props = {
  isbn: Isbn13;
  options: string[];
  filterSetId: string;
  filters: { anywhere: string }[][];
  idx1: number;
  idx2: number;
};

export default function SearchConditionItem({ isbn, options, filterSetId, filters, idx1, idx2 }: Props) {
  const dispatch = useAppDispatch();
  const updateAnywhere = (anywhere: string) => {
    const newFilters = structuredClone(filters);
    if (!anywhere && idx2 < newFilters[idx1].length - 1) {
      newFilters[idx1].splice(idx2, 1);
    } else {
      if (anywhere && idx2 === newFilters[idx1].length - 1) {
        newFilters[idx1].push({ anywhere: '' });
      }
      newFilters[idx1][idx2].anywhere = anywhere;
    }
    dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId, filters: newFilters }));
  };
  const condition = filters.at(idx1)?.at(idx2);

  return (
    <div className="flex gap-2 items-center">
      {idx2 ? <div className="text-xs">AND</div> : null}
      <ComboInput
        label="キーワード検索"
        list={options.map(o => ({ label: o, value: o }))}
        value={condition?.anywhere || ''}
        setValue={updateAnywhere}
      />
    </div>
  );
}
