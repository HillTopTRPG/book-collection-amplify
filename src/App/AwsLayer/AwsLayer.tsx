import type { ReactNode } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import AuthWrapper from './AuthWrapper';
import LoginPage from './LoginPage';

type Props = {
  children: ReactNode;
};

export default function AwsLayer({ children }: Props) {
  return (
    <Authenticator.Provider>
      <AuthWrapper>
        <LoginPage>{children}</LoginPage>
      </AuthWrapper>
    </Authenticator.Provider>
  );
}
