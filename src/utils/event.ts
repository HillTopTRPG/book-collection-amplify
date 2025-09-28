import type { MouseEvent, TouchEvent } from 'react';

export const invokeTouchEvent = (type: 'touchstart' | 'touchend', e: MouseEvent) => {
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

  // 親要素に対してイベントを dispatch
  const parent = (e.target as Element).parentElement;
  if (parent) {
    parent.dispatchEvent(touchEvent);
  }
};

export const redirectTouchEvent = (type: 'touchstart' | 'touchend', e: TouchEvent) => {
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
  const touchEvent = new TouchEvent(type, {
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
    parent.dispatchEvent(touchEvent);
  }
};
