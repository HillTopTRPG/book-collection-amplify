import { useCallback, useEffect, useState } from 'react';

interface UseDrawerAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  animationDuration?: number;
}

interface UseDrawerAnimationReturn {
  isVisible: boolean;
  shouldRender: boolean;
  handleClose: () => void;
}

export const useDrawerAnimation = ({
  isOpen,
  onClose,
  animationDuration = 300,
}: UseDrawerAnimationProps): UseDrawerAnimationReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [_, setIsAnimating] = useState(false);
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

  return {
    isVisible,
    shouldRender,
    handleClose,
  };
};