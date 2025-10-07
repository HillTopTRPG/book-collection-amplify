import type { PanInfo } from 'framer-motion';
import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

// スマートフォン用の判定設定
const MOBILE_CONFIG = {
  // 画面端判定: 画面幅の何%以上で画面端とみなすか
  edgeThresholdPercent: 0.9, // 90%
  // フリック判定: 速度の閾値（px/s）
  velocityThreshold: 500,
} as const;

// デバイスタイプを判定
const getDeviceType = (width: number): 'mobile' | 'tablet' | 'desktop' => {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// レスポンシブな閾値を計算する関数（タブレット/デスクトップ用）
const calculateSwipeThreshold = (width: number): number => {
  // タブレット（640px - 1024px）: 画面幅の25%
  if (width < 1024) {
    return width * 0.25;
  }
  // デスクトップ（>= 1024px）: 200px固定
  return 200;
};

const judgeSwipe = (
  deviceType: 'mobile' | 'tablet' | 'desktop',
  swipeThreshold: number,
  info: PanInfo
): { result: boolean; direction: 'left' | 'right'; debugMessage: string | null } => {
  const swipeDistance = info.offset.x;
  const endPointX = info.point.x;
  const screenWidth = window.innerWidth;
  const direction = swipeDistance > 0 ? 'right' : 'left';
  let result = false;
  let debugMessage: string | null = null;

  if (deviceType === 'mobile') {
    // スマートフォン: 画面端判定 または フリック判定
    const edgeThreshold = screenWidth * MOBILE_CONFIG.edgeThresholdPercent;
    const isNearLeftEdge = swipeDistance < 0 && endPointX < screenWidth * (1 - MOBILE_CONFIG.edgeThresholdPercent);
    const isNearRightEdge = swipeDistance > 0 && endPointX > edgeThreshold;
    const isNearEdge = isNearLeftEdge || isNearRightEdge;

    if (isNearEdge) {
      const edgePosition = isNearLeftEdge ? '左端' : '右端';

      result = true;
      debugMessage = `${edgePosition}到達 (終了位置: ${endPointX.toFixed(0)}px / 画面幅: ${screenWidth}px)`;
    }
  } else {
    // タブレット/デスクトップ: 従来通りの距離判定
    if (Math.abs(swipeDistance) > swipeThreshold) {
      result = true;
      debugMessage = `距離到達 (${Math.abs(swipeDistance).toFixed(0)}px)`;
    }
  }
  if (result) {
    debugMessage = `✅ スワイプ確定: ${direction}方向 - ${debugMessage}`;
  } else {
    const debugInfo =
      deviceType === 'mobile'
        ? `終了位置: ${endPointX.toFixed(0)}px`
        : `距離: ${Math.abs(swipeDistance).toFixed(0)}px (閾値: ${swipeThreshold.toFixed(0)}px)`;
    debugMessage = `❌ スワイプ未達 - ${debugInfo}`;
  }
  return { result, direction, debugMessage };
};

interface UseBookStatusSwiperOptions {
  swipingCardApiId: RefObject<string | null>;
  onSwipeComplete: (direction: 'left' | 'right') => void;
  currentCardId: string | null;
}

export const useBookStatusSwiper = ({
  swipingCardApiId,
  onSwipeComplete,
  currentCardId,
}: UseBookStatusSwiperOptions) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(() => getDeviceType(window.innerWidth));
  const [swipeThreshold, setSwipeThreshold] = useState(() => calculateSwipeThreshold(window.innerWidth));
  const [dragX, setDragX] = useState(0);
  const [swipeOutDirection, setSwipeOutDirection] = useState<'left' | 'right' | null>(null);

  // 画面サイズ変更時に閾値とデバイスタイプを再計算
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newDeviceType = getDeviceType(width);
      const newThreshold = calculateSwipeThreshold(width);

      setDeviceType(newDeviceType);
      setSwipeThreshold(newThreshold);

      let deviceLabel = 'デスクトップ';
      if (newDeviceType === 'mobile') {
        deviceLabel = 'スマートフォン';
      } else if (newDeviceType === 'tablet') {
        deviceLabel = 'タブレット';
      }
      console.log(`📱 デバイス: ${deviceLabel}, 画面幅: ${width}px, 閾値: ${newThreshold.toFixed(0)}px`);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragX(info.offset.x);

    // const { result, direction } = judgeSwipe(deviceType, swipeThreshold, info);
    // console.log(
    //   `スワイプ中: ${direction}方向に${Math.abs(info.offset.x).toFixed(0)}px移動 ${result ? '(離して確定)' : ''}`
    // );
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { result, direction } = judgeSwipe(deviceType, swipeThreshold, info);

    if (result) {
      // スワイプ成功時、現在のカードIDを保存してアニメーション開始
      swipingCardApiId.current = currentCardId;
      setSwipeOutDirection(direction);
    } else {
      setDragX(0);
    }

    // console.log(debugMessage);
  };

  const resetDrag = () => {
    setDragX(0);
    setSwipeOutDirection(null);
    // swipingCardApiId.current = null;
  };

  const handleSwipeOutComplete = () => {
    if (swipeOutDirection) {
      onSwipeComplete(swipeOutDirection);
    }
    // 配列から削除された後にリセットを実行するため、次のティックまで遅延
    resetDrag();
    // setTimeout(() => {
    // }, 0);
  };

  // ドラッグ量に応じた回転角度を計算（最大15度）
  const rotate = useMemo(() => (dragX / window.innerWidth) * 15, [dragX]);

  // 透明度を計算
  const markOpacity = useMemo(() => Math.min(Math.abs(dragX) / swipeThreshold, 1), [dragX, swipeThreshold]);
  const navOpacity = useMemo(() => Math.min(Math.abs(dragX) / swipeThreshold + 0.6, 1), [dragX, swipeThreshold]);

  return {
    dragX,
    navOpacity,
    rotate,
    markOpacity,
    swipeOutDirection,
    handleDrag,
    handleDragEnd,
    handleSwipeOutComplete,
    swipingCardApiId,
  };
};
