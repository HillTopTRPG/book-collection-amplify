import type { ComponentProps } from 'react';
import { omit } from 'es-toolkit/compat';
import BookStatusCheck from './BookStatusCheck.tsx';

type Props = Omit<ComponentProps<typeof BookStatusCheck>, 'value'>;

export default function BookStatusChecks(props: Props) {
  const omittedProps = omit(props, 'value');

  return (
    <>
      <BookStatusCheck value="Unregistered" {...omittedProps} />
      <BookStatusCheck value="NotBuy" {...omittedProps} />
      <BookStatusCheck value="Hold" {...omittedProps} />
      <BookStatusCheck value="Planned" {...omittedProps} />
      <BookStatusCheck value="Owned" {...omittedProps} />
    </>
  );
}
