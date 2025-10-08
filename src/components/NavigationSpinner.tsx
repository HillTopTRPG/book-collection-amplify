import { Spinner } from '@/components/ui/shadcn-io/spinner/spinner';
import { useAppSelector } from '@/store/hooks';
import { selectIsNavigating } from '@/store/uiSlice';

export default function NavigationSpinner() {
  const isNavigating = useAppSelector(selectIsNavigating);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-background rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <Spinner variant="circle" size={48} />
        <div className="text-sm text-muted-foreground">読み込み中...</div>
      </div>
    </div>
  );
}
