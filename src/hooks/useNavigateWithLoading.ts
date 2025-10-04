import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setNavigating } from '@/store/uiSlice';

export const useNavigateWithLoading = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const locationKeyRef = useRef(location.key);

  // 画面遷移が完了したらローディング状態をリセット
  useEffect(() => {
    // location.keyが変わったら画面遷移が完了したと判断
    if (locationKeyRef.current !== location.key) {
      locationKeyRef.current = location.key;

      // requestAnimationFrameを2回使って確実にレンダリング完了を待つ
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dispatch(setNavigating(false));
        });
      });
    }
  }, [location.key, dispatch]);

  return useCallback(
    (to: string | number) => {
      // ローディング状態を設定
      dispatch(setNavigating(true));

      // navigate実行
      if (typeof to === 'number') {
        void navigate(to);
      } else {
        void navigate(to);
      }
    },
    [navigate, dispatch]
  );
};
