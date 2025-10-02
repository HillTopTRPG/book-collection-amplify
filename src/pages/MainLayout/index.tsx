import type { BottomNavigationItem } from './BottomNavigation';
import { Barcode, Home, Search } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import BookDetailDialog from '@/components/Dialog/BookDetailDialog';
import FilterDetailDrawer from '@/components/Drawer/FilterDetailDrawer';
import BottomNavigation from './BottomNavigation';
import MenuBar from './MenuBar';

const MAIN_BOTTOM_NAVIGATE_LIST: BottomNavigationItem[] = [
  {
    path: '/',
    icon: Home,
    label: 'ホーム',
    handleClick: navigate => navigate('/'),
  },
  {
    path: '/scan',
    icon: Barcode,
    label: 'スキャン',
    handleClick: navigate => navigate('/scan'),
  },
  {
    path: '/collection',
    icon: Search,
    label: '検索',
    handleClick: navigate => navigate('/collection'),
  },
];

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
      <BottomNavigation list={MAIN_BOTTOM_NAVIGATE_LIST} />

      {/* ドロワー */}
      <FilterDetailDrawer />

      {/* ダイアログ */}
      <BookDetailDialog />
    </>
  );
}
