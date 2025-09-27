import type { ReactNode } from 'react';
import { Authenticator, useTheme, View, Image, Text, Heading } from '@aws-amplify/ui-react';

import '@aws-amplify/ui-react/styles.css';

const components = {
  Header() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="Book Collection Logo"
          src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ctext y='.9em' font-size='80'%3e📚%3c/text%3e%3c/svg%3e"
          width="60px"
          height="60px"
        />
        <Heading level={3} style={{ color: '#7c3aed' }}>
          マイ書目コンシェルジュ
        </Heading>
        <Text style={{ color: '#6b7280' }}>ログインして蔵書コレクションを管理しましょう</Text>
      </View>
    );
  },

  Footer() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Text style={{ color: '#6b7280', fontSize: '14px' }}>アカウントをお持ちでない場合は新規登録してください</Text>
      </View>
    );
  },
};

const formFields = {
  signIn: {
    username: {
      placeholder: 'メールアドレスを入力してください',
    },
  },
  signUp: {
    password: {
      placeholder: 'パスワードを入力してください',
    },
    confirm_password: {
      placeholder: 'パスワードを再入力してください',
    },
  },
};

interface LoginPageProps {
  children: ReactNode;
}

export default function LoginPage({ children }: LoginPageProps) {
  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email']}
      components={components}
      formFields={formFields}
      hideSignUp={false}
    >
      {children}
    </Authenticator>
  );
}
