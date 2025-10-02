import type { NdlFullOptions } from '@/pages/ScannedBookPage/FilterSets/NdlOptionsForm.tsx';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookDetail } from '@/types/book.ts';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { ListFilterPlus, Pencil, Save } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import SelectBox from '@/components/SelectBox.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useAwsAccess } from '@/hooks/useAwsAccess.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { selectAllFilterResults } from '@/store/ndlSearchSlice.ts';
import { BookStatusEnum, updateTempFilterSetOption } from '@/store/subscriptionDataSlice.ts';
import { getKeys } from '@/utils/type.ts';
import NdlOptionsForm from './NdlOptionsForm.tsx';

type Props = {
  primeFilterSet: { filterSet: FilterSet; books: BookDetail[] } | null;
  otherFilterSets: { filterSet: FilterSet; books: BookDetail[] }[];
  scannedItemMapValue: ScannedItemMapValue;
  selectedFilterSet: string | null;
  setSelectedFilterSet: Dispatch<SetStateAction<string | null>>;
};

export default function FilterSets({
  primeFilterSet,
  otherFilterSets,
  scannedItemMapValue,
  selectedFilterSet,
  setSelectedFilterSet,
}: Props) {
  const dispatch = useAppDispatch();
  const { createFilterSet, createCollections } = useAwsAccess();
  const allFilterResults = useAppSelector(selectAllFilterResults);

  const filterSet = useMemo(() => {
    if (!selectedFilterSet) return null;
    if (primeFilterSet?.filterSet.id === selectedFilterSet) return primeFilterSet.filterSet;
    return otherFilterSets.find(({ filterSet }) => filterSet.id === selectedFilterSet)?.filterSet ?? null;
  }, [otherFilterSets, primeFilterSet?.filterSet, selectedFilterSet]);

  const fetchFullOptions = useMemo(() => filterSet?.fetch, [filterSet?.fetch]);

  const options = useMemo((): Record<string, { label: ReactNode; disabled: boolean }> | null => {
    if (!allFilterResults) return null;
    return [primeFilterSet, ...otherFilterSets].reduce<Record<string, { label: ReactNode; disabled: boolean }>>(
      (acc, info) => {
        if (info) {
          acc[info.filterSet.id] = { label: info.filterSet.name, disabled: false };
        }
        return acc;
      },
      {}
    );
  }, [allFilterResults, otherFilterSets, primeFilterSet]);

  const handleOptionsChange = useCallback(
    (fetch: NdlFullOptions) => {
      if (!selectedFilterSet) return;
      dispatch(updateTempFilterSetOption({ id: selectedFilterSet, fetch }));
    },
    [dispatch, selectedFilterSet]
  );

  const handleFilterSetCreate = useCallback(async () => {
    const { book, collection } = scannedItemMapValue.bookDetail;

    let collectionId = collection.id;

    console.log('collectionId', collectionId);

    if (collection.type !== 'db') {
      const collection = await createCollections({ isbn: book.isbn, status: BookStatusEnum.Unregistered });
      if (!collection) return;
      collectionId = collection.id;
    }
    console.log('collectionId', collectionId);
    void createFilterSet({
      name: book.title || '無名のフィルター',
      fetch: {
        title: book.title || '無名',
        publisher: book.publisher ?? '',
        creator: book.creator?.at(0) ?? '',
        usePublisher: true,
        useCreator: true,
      },
      collectionId,
      filters: [{ list: [{ keyword: '', sign: '*=' }], grouping: 'date' }],
    });
  }, [createCollections, createFilterSet, scannedItemMapValue.bookDetail]);

  return (
    <div className="flex flex-col bg-background px-2 pt-2 pb-5">
      <div className="text-xs">検索条件セット</div>
      {!options ? <Spinner variant="bars" /> : null}
      <div className="flex gap-3 ml-3 mb-5 justify-stretch items-stretch">
        {options && getKeys(options).length ? (
          <SelectBox
            className="flex-1"
            options={options}
            value={selectedFilterSet ?? ''}
            onChange={setSelectedFilterSet}
          />
        ) : null}
        <Button className="box-border h-8.5 gap-1" size="icon" onClick={handleFilterSetCreate} disabled={!options}>
          <Pencil />
        </Button>
        <Button className="box-border h-8.5 gap-1" size="icon" onClick={handleFilterSetCreate} disabled={!options}>
          <Save />
        </Button>
      </div>
      {!primeFilterSet ? (
        <Button className="box-border h-8.5 gap-1" size="sm" onClick={handleFilterSetCreate} disabled={!options}>
          <ListFilterPlus />
          新規追加
        </Button>
      ) : null}
      {fetchFullOptions ? <NdlOptionsForm defaultValues={fetchFullOptions} onChange={handleOptionsChange} /> : null}
    </div>
  );
}
