import type { ReactNode } from 'react';

type Props = {
  value: string | null | undefined;
  className?: string;
  children?: (value: string) => ReactNode;
  label?: string;
};

export default function NdlCardItem({ value, className, children, label }: Props) {
  if (!value) return null;
  const staticValue = label ? `${label}: ${value}` : value;

  return (
    <span className={className}>{ children ? children(value) : staticValue }</span>
  );
}
