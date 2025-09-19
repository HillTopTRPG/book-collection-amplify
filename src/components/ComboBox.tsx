import { useCallback, useState } from 'react';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  className?: string;
  list: { value: string; label: string }[];
  value: string;
  setValue: (value: string) => void;
};

export default function ComboBox({ label, className, list, value, setValue }: Props) {
  const [open, setOpen] = useState(false);

  const onSelect = useCallback(
    (currentValue: string) => {
      setValue(currentValue === value ? '' : currentValue);
      setOpen(false);
    },
    [setValue, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between bg-foreground text-background gap-0 py-2 px-4 max-w-full ${className}`}
        >
          <span className="flex-1 truncate inline-block">
            {value ? list.find(item => item.value === value)?.label : label}
          </span>
          <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder={`${label}の検索`} />
          <CommandList>
            <CommandEmpty>見つかりませんでした。</CommandEmpty>
            <CommandGroup>
              {list.map(item => (
                <CommandItem key={item.value} value={item.value} onSelect={onSelect}>
                  <CheckIcon className={cn('mr-2 h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
