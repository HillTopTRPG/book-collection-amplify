import {Fragment, ReactNode} from 'react';
import BottomNavigation from './BottomNavigation';
import MenuBar from '@/components/MenuBar.tsx';

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Fragment>
      {/* メニューバー */}
      <MenuBar />

      {/* メインコンテンツ - ボトムナビの高さ分をpaddingで確保 */}
      <div className="mt-12 mb-20 w-full md:w-[32rem] flex-1 flex flex-col">
        {children}
      </div>

      {/* ボトムナビゲーション */}
      <BottomNavigation />
    </Fragment>
  );
}