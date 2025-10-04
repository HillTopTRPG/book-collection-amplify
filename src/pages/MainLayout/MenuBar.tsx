import { useAuthenticator } from '@aws-amplify/ui-react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading';

const changeDarkMode = (mode: 'dark' | 'light') => {
  localStorage.theme = mode;
  document.documentElement.classList.toggle('dark', mode === 'dark');
};

export default function MenuBar() {
  const { signOut, user } = useAuthenticator();
  const navigate = useNavigateWithLoading();
  const [theme, setTheme] = useState<'dark' | 'light'>(
    localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light'
  );

  changeDarkMode(theme);

  const handleSwitchTheme = useCallback(() => {
    setTheme(localStorage.theme === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLogout = useCallback(() => {
    signOut();
    navigate('/');
  }, [navigate, signOut]);

  return (
    <div className="fixed left-0 top-0 right-0 bg-background h-[3rem] flex items-center shadow-xl px-2 gap-2 z-[100]">
      <div className="flex-1 font-bold">マイ書目コンシェルジュ</div>
      <div className="text-sm text-muted-foreground">{user.signInDetails?.loginId}</div>
      <Button size="icon" className="rounded-full" variant="secondary" onClick={handleSwitchTheme}>
        {theme === 'dark' ? <Moon /> : <Sun />}
      </Button>
      <Button size="icon" className="rounded-full" variant="secondary" onClick={handleLogout}>
        <LogOut />
      </Button>
    </div>
  );
}
