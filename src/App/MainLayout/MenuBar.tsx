import { useCallback, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

const onChangeDarkMode = (mode: 'dark' | 'light') => {
  localStorage.theme = mode;
  document.documentElement.classList.toggle('dark', mode === 'dark');
};

export default function MenuBar() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light'
  );

  onChangeDarkMode(theme);

  const onSwitchTheme = useCallback(() => {
    setTheme(localStorage.theme === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <div className="fixed left-0 top-0 right-0 bg-background h-[3rem] flex items-center px-2 gap-2 z-50">
      <div className="flex-1">マイ書目コンシェルジュ</div>
      <Button size="icon" className="rounded-full" variant="secondary" onClick={onSwitchTheme}>
        {theme === 'dark' ? <Moon /> : <Sun />}
      </Button>
    </div>
  );
}
