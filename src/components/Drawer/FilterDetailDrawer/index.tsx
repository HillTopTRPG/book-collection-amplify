import type { CollectionBook, FilterSet } from '@/types/book.ts';
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

  const handleCloseDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const { isVisible, shouldRender, handleClose } = useDrawerAnimation({
    isOpen: Boolean(filterSet?.id),
    onClose: handleCloseDrawer,
    animationDuration: 300,
  });

  const [bufferedFilterSet] = useState<FilterSet | null>(null);
  const [bufferedBookDatas] = useState<CollectionBook[]>([]);

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
      <DrawerContent filterSet={bufferedFilterSet} collectionBooks={bufferedBookDatas} />
    </DrawerFrame>
  );

  return createPortal(drawerContent, document.body);
}
