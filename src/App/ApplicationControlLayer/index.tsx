import type { ReactNode } from 'react';
import QueueProcessLayer from './QueueProcessLayer.tsx';
import SubscribeLayer from './SubscribeLayer.tsx';

type Props = {
  children: ReactNode;
};

export default function ApplicationControlLayer({ children }: Props) {
  return (
    <>
      <QueueProcessLayer>
        <SubscribeLayer>{children}</SubscribeLayer>
      </QueueProcessLayer>
    </>
  );
}
