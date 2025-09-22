import type { ReactNode } from 'react';
import { keys } from 'es-toolkit/compat';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { cn } from '@/lib/utils.ts';

const COLOR_CLASS = 'bg-foreground text-background';

export type SelectBoxOption = { label: ReactNode; disabled?: boolean };

type Props<Options extends Record<string, SelectBoxOption>> = {
  label?: string;
  className?: string;
  options: Options;
  value: keyof Options;
  onChange: (value: keyof Options) => void;
};

export default function SelectBox<Options extends Record<string, SelectBoxOption>>({
  label,
  className,
  options,
  value,
  onChange,
}: Props<Options>) {
  return (
    <Select value={value.toString()} onValueChange={onChange}>
      <SelectTrigger className={cn(COLOR_CLASS, className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className={COLOR_CLASS}>
        <SelectGroup>
          {label ? <SelectLabel>{label}</SelectLabel> : null}
          {keys(options).map(key => (
            <SelectItem key={key} value={key} className={COLOR_CLASS} disabled={options[key].disabled}>
              {options[key].label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
