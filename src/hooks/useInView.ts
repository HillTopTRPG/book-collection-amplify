import { useEffect, useRef, useState } from 'react';

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean; // true: 一度だけ検知
};

export const useInView = (options: UseInViewOptions = {}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once) {
            observer.disconnect(); // 一度だけ検知
          }
        } else if (!options.once) {
          setInView(false); // 複数回検知対応
        }
      },
      {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold ?? 0.5,
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold, options.once]);

  return { ref, inView };
};
