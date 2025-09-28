import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from '@/App';
import { setupMockFetch } from '@/utils/mock';
import { store } from './store';

import './index.css';

setupMockFetch();

// スワイプナビゲーション防止用の関数
const preventSwipeNavigation = () => {
  let startX = 0;
  let startY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!startX || !startY) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs(currentY - startY);

    // 水平スワイプが垂直スワイプより大きく、一定の閾値を超えた場合
    if (diffX > diffY && diffX > 50) {
      // 画面端からのスワイプの場合は特に注意深く防止
      if (startX < 50 || startX > window.innerWidth - 50) {
        e.preventDefault();
      }
    }
  };

  // パッシブリスナーを false にして preventDefault を有効にする
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });

  // クリーンアップ用の関数を返す
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
};

// アプリ起動時にスワイプナビゲーション防止を初期化
preventSwipeNavigation();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
