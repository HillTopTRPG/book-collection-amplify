import type { ReactNode } from 'react';
import AuthEventListener from './AuthEventListener.tsx';
import QueueProcessLayer from './QueueProcessLayer.tsx';

type Props = {
  children: ReactNode;
};

export default function ApplicationControlLayer({ children }: Props) {
  return (
    <AuthEventListener>
      <QueueProcessLayer />
      {children}
    </AuthEventListener>
  );
}
