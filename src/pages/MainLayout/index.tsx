import { useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import FilterDetailDrawer from '@/components/Drawer/FilterDetailDrawer';
import { useAppDispatch } from '@/store/hooks.ts';
import { setScrollValue } from '@/store/uiSlice.ts';
import BottomNavigation from './BottomNavigation';
import MenuBar from './MenuBar';

export default function MainLayout() {
  const dispatch = useAppDispatch();

  const onScroll = useCallback(
    (e: Event) => {
      e.preventDefault();
      setTimeout(() => {
        const scrollTop = document.getElementById('root')?.scrollTop;
        if (scrollTop !== undefined) dispatch(setScrollValue({ key: 'body', value: scrollTop }));
      });
    },
    [dispatch]
  );

  useEffect(() => {
    console.log('regist scroll event', document.getElementById('root'));
    document.getElementById('root')?.addEventListener('scroll', onScroll, false);
    return () => {
      document.getElementById('root')?.removeEventListener('scroll', onScroll);
    };
  }, [onScroll]);

  return (
    <>
      {/* メニューバー */}
      <MenuBar />

      {/* メインコンテンツ - ボトムナビの高さ分をpaddingで確保 */}
      <div className="pt-12 pb-16 w-full md:w-[32rem] flex flex-col">
        <Outlet />
      </div>

      {/* ボトムナビゲーション */}
      <BottomNavigation />

      {/* ドロワー */}
      <FilterDetailDrawer />
    </>
  );
}
