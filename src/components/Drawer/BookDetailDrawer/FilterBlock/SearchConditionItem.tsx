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

    // ANDブロックのための処理
    if (!anywhere && idx2 < newFilters[idx1].length - 1) {
      newFilters[idx1].splice(idx2, 1);
    } else {
      if (anywhere && idx2 === newFilters[idx1].length - 1) {
        newFilters[idx1].push({ anywhere: '' });
      }
      newFilters[idx1][idx2].anywhere = anywhere;
    }

    if (idx1 === 0) {
      // プライマリブロックのための処理
      if (newFilters.length === 1 && newFilters[idx1][0]) {
        newFilters.push([{ anywhere: '' }]);
      }
    } else {
      // ORブロックのための処理
      if (idx1 < newFilters.length - 1 && !newFilters[idx1][0]) {
        newFilters.splice(idx1, 1);
      } else {
        if (idx1 === newFilters.length - 1 && newFilters[idx1][0]) {
          newFilters.push([{ anywhere: '' }]);
        }
      }
    }
    dispatch(updateFetchedFilterAnywhere({ key: isbn, filterSetId, filters: newFilters }));
  };
  const condition = filters.at(idx1)?.at(idx2);

  return (
    <div className="flex items-center">
      {!idx2 && <div className="text-sm min-w-[4rem] flex items-center">{!idx1 ? '必須条件' : `OR条件${idx1}`}</div>}
      {idx2 ? <div className="text-xs min-w-[4rem] text-right pr-1">AND</div> : null}
      <ComboInput
        label="キーワード検索"
        list={options.map(o => ({ label: o, value: o }))}
        value={condition?.anywhere || ''}
        setValue={updateAnywhere}
      />
    </div>
  );
}
