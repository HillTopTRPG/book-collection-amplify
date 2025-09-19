import type { ReactNode } from 'react';

type Props = {
  onClose: () => void;
  children: ReactNode;
};

export default function OverPanel({ onClose, children }: Props) {
  return (
    <div
      className="absolute inset-0 bg-foreground/50 flex items-center justify-around"
      onClick={e => {
        onClose();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
