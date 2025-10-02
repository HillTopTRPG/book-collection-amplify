import type { ClassValue } from 'clsx';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils.ts';

export type BottomNavigationItem = {
  path?: RegExp | string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  label: string;
  handleClick: (navigate: ReturnType<typeof useNavigate>) => void;
  disabled?: boolean;
};

type Props = {
  list: BottomNavigationItem[];
  zIndex?: number;
};

export default function BottomNavigation({ list, zIndex }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  zIndex ||= 1000;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 px-2 py-1" style={{ zIndex }}>
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {list.map(({ path, icon: Icon, label, handleClick, disabled }, idx) => {
          const isActive = (() => {
            if (!path) return false;
            if (typeof path === 'string') return location.pathname === path;
            return path.test(location.pathname);
          })();

          const classValue = ((): ClassValue => {
            if (disabled) return 'text-gray-700 cursor-not-allowed';
            return isActive
              ? 'cursor-pointer text-purple-600 dark:text-purple-200 bg-purple-200 dark:bg-purple-800'
              : 'cursor-pointer text-gray-600 bg-purple-600/15 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950';
          })();

          return (
            <div
              key={idx}
              onClick={() => !disabled && handleClick(navigate)}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[4rem] p-2 rounded-lg select-none',
                'shadow-sm shadow-purple-600/70',
                classValue
              )}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
