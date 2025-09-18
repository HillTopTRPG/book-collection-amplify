import { useEffect, useState } from 'react';

import { CircleChevronLeft } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';

import DrawerFrame from '@/components/Drawer/DrawerFrame.tsx';
import { Button } from '@/components/ui/button';
import { useDrawerAnimation } from '@/hooks/useDrawerAnimation';
import { useAppSelector } from '@/store/hooks.ts';
import { updateSelectedScanIsbn, selectSelectedScannedItemMapValue } from '@/store/scannerSlice.ts';

import DrawerContent from './DrawerContent.tsx';

// import type { Schema } from '$/amplify/data/resource.ts';
//
// const userPoolClient = generateClient<Schema>({
//   authMode: 'userPool'
// });
//
// const apiKeyClient = generateClient<Schema>({
//   authMode: 'apiKey'
// });

export default function BookDetailDrawer() {
  const dispatch = useDispatch();
  const selectedScannedItemMapValue = useAppSelector(selectSelectedScannedItemMapValue);

  useEffect(() => {
    console.log('BookDetailDrawer/index selectedScannedItemMapValue:', JSON.stringify(selectedScannedItemMapValue, null, 2));
  }, [selectedScannedItemMapValue]);

  const {
    isVisible,
    shouldRender,
    handleClose,
  } = useDrawerAnimation({
    isOpen: Boolean(selectedScannedItemMapValue),
    onClose: () => { dispatch(updateSelectedScanIsbn(null)); },
    animationDuration: 300
  });

  const [bufferedValue, setBufferedValue] = useState<typeof selectedScannedItemMapValue>(null);
  useEffect(() => {
    if (selectedScannedItemMapValue) {
      setBufferedValue(structuredClone(selectedScannedItemMapValue));
    } else if (!shouldRender) {
      setBufferedValue(null);
    }
  }, [selectedScannedItemMapValue, shouldRender]);

  if (!shouldRender || !bufferedValue) return null;

  const header = (
    <>
      <Button onClick={handleClose} size="icon" variant="ghost" className="size-8">
        <CircleChevronLeft />
      </Button>
      <div className="flex flex-col flex-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight text-left truncate">
          グループ本の絞り込み
        </h2>
      </div>
    </>
  );

  const drawerContent = (
    <DrawerFrame isVisible={isVisible} header={header} onClose={handleClose}>
      <DrawerContent scannedItemMapValue={bufferedValue} />
    </DrawerFrame>
  );

  return createPortal(drawerContent, document.body);
}