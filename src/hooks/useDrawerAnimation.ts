import { useCallback, useEffect, useState } from 'react';

interface UseDrawerAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  animationDuration?: number;
}

interface UseDrawerAnimationReturn {
  isVisible: boolean;
  isAnimating: boolean;
  shouldRender: boolean;
  handleClose: () => void;
  overlayClassName: string;
  drawerClassName: string;
}

export const useDrawerAnimation = ({
  isOpen,
  onClose,
  animationDuration = 300,
}: UseDrawerAnimationProps): UseDrawerAnimationReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setIsVisible(false);

    setTimeout(() => {
      setShouldRender(false);
      setIsAnimating(false);
      onClose();
    }, animationDuration);
  }, [onClose, animationDuration]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Double RAF pattern for stable CSS transitions
      let rafId2: number;

      const rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      return () => {
        cancelAnimationFrame(rafId1);
        if (rafId2) cancelAnimationFrame(rafId2);
      };
    } else {
      setIsVisible(false);
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, animationDuration]);

  const overlayClassName = `
    fixed inset-0 bg-black/50 z-40 transition-opacity duration-${animationDuration} ease-in-out
    ${isVisible ? 'opacity-100' : 'opacity-0'}
  `.trim();

  const drawerClassName = `
    fixed top-0 right-0 h-screen w-80 bg-background border-l z-50 shadow-lg
    transition-transform duration-${animationDuration} ease-in-out
    ${isVisible ? 'transform translate-x-0' : 'transform translate-x-full'}
  `.trim();

  return {
    isVisible,
    isAnimating,
    shouldRender,
    handleClose,
    overlayClassName,
    drawerClassName,
  };
};