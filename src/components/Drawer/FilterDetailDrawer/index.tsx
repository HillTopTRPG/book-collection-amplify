import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { FilterSet } from '@/store/subscriptionDataSlice.ts';
import { CircleChevronLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import DrawerFrame from '@/components/Drawer/DrawerFrame.tsx';
import { Button } from '@/components/ui/button';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { closeDrawer, selectSelectedFilterSet } from '@/store/filterDetailDrawerSlice.ts';
import { useAppSelector } from '@/store/hooks.ts';
import DrawerContent from './DrawerContent.tsx';

export default function FilterDetailDrawer() {
  const dispatch = useDispatch();
  const filterSet = useAppSelector(selectSelectedFilterSet);
  // const scannedItemMapValueBySelectedFilterSet = useAppSelector(selectScannedItemMapValueBySelectedFilterSet);

  // const filterSetId = filterSet?.id;

  // useEffect(() => {
  //   if (!filterSet) return;
  //   fetchNdlSearch(filterSet.fetch).then(({ books }) => {
  //     dispatch(updateFetchResult({ [filterSet.id]: books }));
  //   });
  // }, [dispatch, filterSet, filterSetId]);

  const onClose = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const { isVisible, shouldRender, handleClose } = useDrawerAnimation({
    isOpen: Boolean(filterSet?.id),
    onClose,
    animationDuration: 300,
  });

  const [bufferedFilterSet] = useState<FilterSet | null>(null);
  const [bufferedScannedItemMapValues] = useState<ScannedItemMapValue[]>([]);
  // useEffect(() => {
  //   if (filterSet) {
  //     setBufferedFilterSet(structuredClone(filterSet));
  //     setBufferedScannedItemMapValues(structuredClone(scannedItemMapValueBySelectedFilterSet));
  //   } else if (!shouldRender) {
  //     setBufferedFilterSet(null);
  //     setBufferedScannedItemMapValues([]);
  //   }
  // }, [scannedItemMapValueBySelectedFilterSet, filterSet, shouldRender]);

  if (!shouldRender || !bufferedFilterSet) return null;

  const header = (
    <>
      <Button onClick={handleClose} size="icon" variant="ghost" className="size-8">
        <CircleChevronLeft />
      </Button>
      <h2 className="text-lg font-semibold leading-none tracking-tight text-left">{bufferedFilterSet.name}</h2>
    </>
  );

  const drawerContent = (
    <DrawerFrame drawerType="bookDetail" isVisible={isVisible} header={header} onClose={handleClose}>
      <DrawerContent filterSet={bufferedFilterSet} scannedItemMapValues={bufferedScannedItemMapValues} />
    </DrawerFrame>
  );

  return createPortal(drawerContent, document.body);
}
