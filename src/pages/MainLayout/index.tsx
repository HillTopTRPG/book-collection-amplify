import { Outlet } from 'react-router-dom';
import BookDetailDialog from '@/components/Dialog/BookDetailDialog';
import FilterDetailDrawer from '@/components/Drawer/FilterDetailDrawer';
import BottomNavigation from './BottomNavigation';
import MenuBar from './MenuBar';

export default function MainLayout() {
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

      {/* ダイアログ */}
      <BookDetailDialog />
    </>
  );
}
