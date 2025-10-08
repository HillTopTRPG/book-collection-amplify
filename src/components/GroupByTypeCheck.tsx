import { MessageCircleQuestionMark } from 'lucide-react';
import { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { IconButton } from '@/components/ui/shadcn-io/icon-button/icon-button';

type Props = {
  groupByType: 'volume' | null;
  onUpdateGroupByType: (groupByType: 'volume' | null) => void;
};

export default function GroupByTypeCheck({ groupByType, onUpdateGroupByType }: Props) {
  const handleGroupByUpdate = useCallback(
    (flg: boolean) => {
      onUpdateGroupByType(flg ? 'volume' : null);
    },
    [onUpdateGroupByType]
  );

  return (
    <div className="flex items-center gap-1">
      <Checkbox id="use-group-by-volume" checked={groupByType === 'volume'} onCheckedChange={handleGroupByUpdate} />
      <Label htmlFor="use-group-by-volume">連載グルーピング</Label>
      <IconButton icon={MessageCircleQuestionMark} className="border-0" />
    </div>
  );
}
