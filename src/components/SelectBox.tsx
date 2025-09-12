import { ReactNode } from 'react';

import { keys } from 'es-toolkit/compat';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select.tsx';

const COLOR_CLASS = 'bg-foreground text-background';

type Props<Options extends Record<string, ReactNode>> = {
  label?: string;
  className: string;
  options: Options;
  value: keyof Options;
  onChange: (value: keyof Options) => void;
}

export default function SelectBox<Options extends Record<string, ReactNode>>({ label, className, options, value, onChange }: Props<Options>) {
  return (
    <Select value={value.toString()} onValueChange={onChange}>
      <SelectTrigger className={`${COLOR_CLASS} ${className}`}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className={COLOR_CLASS}>
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {keys(options).map((key) => (
            <SelectItem key={key} value={key} className={COLOR_CLASS}>{options[key]}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
