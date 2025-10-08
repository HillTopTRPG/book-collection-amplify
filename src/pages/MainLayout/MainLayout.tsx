import type { BottomNavigationItem } from './BottomNavigation';
import { Barcode, Home, LibraryBig } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import BookDialog from '@/components/Dialog/BookDialog/BookDialog';
import BookStatusSwiper from '@/components/Dialog/BookStatusSwiper/BookStatusSwiper';
import FilterDetailDrawer from '@/components/Drawer/FilterDetailDrawer/FilterDetailDrawer';
import NavigationSpinner from '@/components/NavigationSpinner';
import { useLogs } from '@/hooks/useLogs.ts';
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
    icon: LibraryBig,
    label: '書目',
    handleClick: navigate => navigate('/collection'),
  },
];

export default function MainLayout() {
  useLogs({ componentName: 'MainLayout' });

  return (
    <>
      {/* メニューバー */}
      <MenuBar />

      {/* メインコンテンツ - ボトムナビの高さ分をpaddingで確保 */}
      <div className="pt-12 pb-16 w-full md:w-[32rem] flex flex-col z-10">
        <Outlet />
        <BookStatusSwiper />
      </div>

      {/* ボトムナビゲーション */}
      <BottomNavigation list={MAIN_BOTTOM_NAVIGATE_LIST} />

      {/* ドロワー */}
      <FilterDetailDrawer />

      {/* ダイアログ */}
      <BookDialog />

      {/* ナビゲーションスピナー */}
      <NavigationSpinner />
    </>
  );
}
