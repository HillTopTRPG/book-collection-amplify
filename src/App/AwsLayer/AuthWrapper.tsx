import type { ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { authStatus } = useAuthenticator();

  if (authStatus === 'configuring') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-600 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
