import type { NdlOptions } from '@/components/Drawer/BookDetailDrawer/NdlOptionsForm.tsx';

export type FilterData = {
  fetch: NdlOptions;
  filter: {
    anywhere: string;
  };
};
