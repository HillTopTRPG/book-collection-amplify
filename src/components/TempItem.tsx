import type { ReactNode } from 'react';
import HighLightText from '@/components/Card/HighLightText.tsx';

type Props = {
  value: string | null | undefined;
  className?: string;
  children?: (value: string) => ReactNode;
  label?: string;
  highLights?: string[];
};

export default function TempItem({ value, className, children, label, highLights }: Props) {
  if (!value) return null;
  const staticValue = label ? `${label}: ${value}` : value;

  return (
    <span className={className}>
      {children ? (
        children(value)
      ) : (
        <HighLightText value={staticValue} subStrList={highLights} subClassName="bg-yellow-700" />
      )}
    </span>
  );
}
