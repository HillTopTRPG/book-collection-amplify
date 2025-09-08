import {Fragment} from 'react';

const BORDER_COMMON = 'absolute z-20 border-black border-solid w-6 h-6';
const BORDER_LEFT = 'left-[48px] border-l-[5px]';
const BORDER_RIGHT = 'right-[48px] border-r-[5px]';
const BORDER_TOP = 'top-[48px] border-t-[5px]';
const BORDER_BOTTOM = 'bottom-[48px] border-b-[5px]';

const LEFT_TOP = [BORDER_COMMON, BORDER_LEFT, BORDER_TOP].join(' ');
const LEFT_BOTTOM = [BORDER_COMMON, BORDER_LEFT, BORDER_BOTTOM].join(' ');
const RIGHT_TOP = [BORDER_COMMON, BORDER_RIGHT, BORDER_TOP].join(' ');
const RIGHT_BOTTOM = [BORDER_COMMON, BORDER_RIGHT, BORDER_BOTTOM].join(' ');

export default function CornerFrame() {
  return (
    <Fragment>
      <span className="absolute z-10 inset-0 outline-[24px] outline-offset-[-24px] outline-black/60 border-solid" style={{outlineStyle: 'solid'}} />
      <span className="absolute z-30 left-[24px] right-[24px] top-1/2 border-red-500/70 border-solid border" />
      <span className={LEFT_TOP} />
      <span className={LEFT_BOTTOM} />
      <span className={RIGHT_TOP} />
      <span className={RIGHT_BOTTOM} />
    </Fragment>
  );
}
