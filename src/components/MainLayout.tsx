import { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';
import MenuBar from '@/components/MenuBar.tsx';

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen w-full md:w-[32rem] pt-12 pb-20">
      {/* メニューバー */}
      <MenuBar />

      {/* メインコンテンツ - ボトムナビの高さ分をpaddingで確保 */}
      {children}
      
      {/* ボトムナビゲーション */}
      <BottomNavigation />
    </div>
  );
}