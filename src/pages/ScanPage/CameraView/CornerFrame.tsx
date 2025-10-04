import { Fragment } from 'react';

export default function CornerFrame() {
  return (
    <Fragment>
      <span
        className="absolute z-10 inset-0 outline-[24px] outline-offset-[-24px] outline-black/60 border-solid"
        style={{ outlineStyle: 'solid' }}
      />
      <span className="absolute z-30 left-[24px] right-[24px] top-1/2 border-red-500/70 border-solid border" />
    </Fragment>
  );
}
