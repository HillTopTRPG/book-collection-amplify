import type { SearchTags } from '@/components/Drawer/BookDetailDrawer/DrawerContent.tsx';
import { cn } from '@/lib/utils.ts';

const LABEL_MAP: Record<keyof SearchTags, string> = {
  title: 'タイトル',
  volume: 'Vol',
  volumeTitle: 'VolT',
  edition: 'Edition',
  seriesTitle: 'Series',
};

const BASE = 'flex flex-col gap-1 text-gray-400 rounded-lg p-2 border';

type Props = {
  tagType: keyof SearchTags;
  value: string;
  searchTags: SearchTags;
  onClick: () => void;
};

export default function SearchTag({ value, tagType, searchTags, onClick }: Props) {
  const selected = searchTags[tagType]?.includes(value) ?? false;
  const stateClass = selected ? 'border-2 border-red-600' : '';

  return (
    <div className={cn(BASE, stateClass)} onClick={onClick}>
      <span className="text-xs">{LABEL_MAP[tagType]}:</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}