import { useCallback, useEffect, useMemo, useState } from 'react';

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
      // Minimal delay for CSS transition to work properly
      const timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 1);

      return () => clearTimeout(timeoutId);
    } else {
      setIsVisible(false);
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, animationDuration]);

  const overlayClassName = useMemo(() =>
    `fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`,
  [isVisible]
  );

  const drawerClassName = useMemo(() =>
    `fixed top-0 right-0 h-screen w-80 bg-background border-l z-50 shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? 'transform translate-x-0' : 'transform translate-x-full'}`,
  [isVisible]
  );

  return {
    isVisible,
    isAnimating,
    shouldRender,
    handleClose,
    overlayClassName,
    drawerClassName,
  };
};