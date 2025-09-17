import type { ReactNode } from 'react';

import HighLightText from '@/components/Card/NdlCard/HighLightText.tsx';

type Props = {
  value: string | null | undefined;
  className?: string;
  children?: (value: string) => ReactNode;
  label?: string;
  highLight?: string;
};

export default function NdlCardItem({ value, className, children, label, highLight }: Props) {
  if (!value) return null;
  const staticValue = label ? `${label}: ${value}` : value;

  return (
    <span className={className}>{ children ? children(value) : <HighLightText value={staticValue} subStr={highLight} subClassName="bg-yellow-700" /> }</span>
  );
}
