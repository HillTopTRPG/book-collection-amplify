import { useEffect, useRef, useState } from 'react';

type DOMSize = {
  width: number;
  height: number;
};

/** DOMサイズの初期値 */
const INITIAL_DOM_SIZE: DOMSize = {
  width: 0,
  height: 0,
};

/**
 * 0表示のチラつきを抑えたDOMサイズ監視hooks
 */
export default function useDOMSize() {
  const [size, setSize] = useState(INITIAL_DOM_SIZE);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 監視前のサイズを保存する
    setSize({
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    const observer = new ResizeObserver(() => {
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    ref,
    size,
  };
}
