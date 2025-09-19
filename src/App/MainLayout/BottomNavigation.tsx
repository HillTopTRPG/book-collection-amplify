import { useAuthenticator } from '@aws-amplify/ui-react';
import { Home, Barcode, User, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navigationItems = [
  {
    path: '/',
    icon: Home,
    label: 'ホーム',
  },
  {
    path: '/scanner',
    icon: Barcode,
    label: 'スキャン',
  },
  {
    path: '/collection',
    icon: Search,
    label: '検索',
  },
];

export default function BottomNavigation() {
  const location = useLocation();
  const { signOut } = useAuthenticator();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navigationItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col min-w-[4rem] items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-purple-600 dark:text-purple-200 bg-purple-200 dark:bg-purple-800'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}

        {/* ログアウトボタン */}
        <Link
          to="/"
          onClick={signOut}
          className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <User size={24} />
          <span className="text-xs mt-1 font-medium">ログアウト</span>
        </Link>
      </div>
    </div>
  );
}
