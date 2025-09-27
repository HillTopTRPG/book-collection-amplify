import type { MouseEvent, TouchEvent, ReactNode } from 'react';
import { useCallback } from 'react';
import { RippleContainer } from '@m_three_ui/m3ripple';
import { cn } from '@/lib/utils.ts';
import '@m_three_ui/m3ripple/css';

const BASE = 'relative p-2';
const FLEX = 'flex items-center justify-center';
const COLOR = 'hover:bg-gray-50/30 dark:hover:bg-white-100/10 transition-colors duration-200';
const TOUCH = 'touch-manipulation min-h-[44px]';

const invokeTouchStart = (type: 'touchstart' | 'touchend', e: MouseEvent) => {
  // touchStartイベントを発火
  const touch = new Touch({
    identifier: 0,
    target: e.target as Element,
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.pageX,
    pageY: e.pageY,
    screenX: e.screenX,
    screenY: e.screenY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  });

  const touchEvent = new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
    view: window,
    detail: 0,
  });

  // イベントオブジェクトに座標情報を直接設定
  Object.defineProperties(touchEvent, {
    clientX: { value: e.clientX, writable: false },
    clientY: { value: e.clientY, writable: false },
    pageX: { value: e.pageX, writable: false },
    pageY: { value: e.pageY, writable: false },
    screenX: { value: e.screenX, writable: false },
    screenY: { value: e.screenY, writable: false },
  });

  e.target.dispatchEvent(touchEvent);
};

const redirectTouchEvent = (type: 'touchstart' | 'touchend', e: TouchEvent) => {
  // React.TouchからネイティブTouchオブジェクトを作成
  const createTouch = (reactTouch: React.Touch): Touch =>
    new Touch({
      identifier: reactTouch.identifier ?? 0,
      target: reactTouch.target,
      clientX: reactTouch.clientX ?? 0,
      clientY: reactTouch.clientY ?? 0,
      pageX: reactTouch.pageX ?? reactTouch.clientX ?? 0,
      pageY: reactTouch.pageY ?? reactTouch.clientY ?? 0,
      screenX: reactTouch.screenX ?? reactTouch.clientX ?? 0,
      screenY: reactTouch.screenY ?? reactTouch.clientY ?? 0,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    });

  const touches = Array.from(e.touches).map(createTouch);
  const targetTouches = Array.from(e.targetTouches).map(createTouch);
  const changedTouches = Array.from(e.changedTouches).map(createTouch);

  // 新しいTouchEventを作成
  const newTouchEvent = new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches,
    targetTouches,
    changedTouches,
    view: window,
    detail: 0,
  });

  // 親要素に対してイベントを dispatch
  const parent = (e.target as Element).parentElement;
  if (parent) {
    parent.dispatchEvent(newTouchEvent);
  }
};

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function CardFrame({ children, onClick, className }: Props) {
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      console.log('handleTouchEnd');
      onClick?.();
      e.stopPropagation();
      setTimeout(() => {
        redirectTouchEvent('touchend', e);
      }, 100);
      // フォーカスアウト
      setTimeout(() => {
        (e.target as HTMLElement).blur();
      }, 100);
    },
    [onClick]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      onClick?.();
      invokeTouchStart('touchstart', e);
      setTimeout(() => {
        invokeTouchStart('touchend', e);
      }, 300);
    },
    [onClick]
  );

  return (
    <RippleContainer className="relative flex" rippleColor="hsla(29,81%,84%,0.15)">
      <div
        className={cn(BASE, FLEX, COLOR, TOUCH, className)}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {children}
      </div>
    </RippleContainer>
  );
}
