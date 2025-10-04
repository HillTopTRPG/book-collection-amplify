import type { ReactNode } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { resetSubscriptionData } from '@/store/subscriptionDataSlice';
import SubscribeLayer from './SubscribeLayer';

type Props = {
  children: ReactNode;
};

/**
 * Amplify Hubの認証イベントを監視し、ログアウト時にストアをクリアするコンポーネント
 * userIdをkeyとしてSubscribeLayerを再マウントすることで、サブスクリプションを完全にリセット
 */
export default function AuthEventListener({ children }: Props) {
  const dispatch = useAppDispatch();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 初期ユーザーIDを取得
    const initUserId = async () => {
      try {
        const session = await fetchAuthSession();
        const currentUserId = session.tokens?.idToken?.payload.sub as string | undefined;
        if (currentUserId) {
          console.log('🔐 Initial user detected:', currentUserId);
          setUserId(currentUserId);
        }
      } catch {
        console.log('⏸️  No authenticated user on mount');
      }
    };

    void initUserId();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('🔔 Auth event:', payload.event, payload);

      switch (payload.event) {
        case 'signedOut':
          console.log('🚪 User signed out - resetting subscription data');
          dispatch(resetSubscriptionData());
          setUserId(null); // userIdをクリアしてSubscribeLayerをアンマウント
          break;

        case 'signedIn': {
          console.log('✅ User signed in - fetching new userId');
          // 新しいユーザーIDを取得してSubscribeLayerを再マウント
          void fetchAuthSession().then(session => {
            const newUserId = session.tokens?.idToken?.payload.sub as string | undefined;
            if (newUserId) {
              console.log('🔄 New user ID:', newUserId);
              setUserId(newUserId);
            }
          });
          break;
        }

        case 'tokenRefresh':
          // トークン更新成功（特別な処理不要）
          break;

        case 'tokenRefresh_failure':
          console.error('❌ Token refresh failed');
          break;

        case 'signInWithRedirect':
        case 'signInWithRedirect_failure':
        case 'customOAuthState':
          // OAuth関連イベント（このアプリでは未使用）
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  // userIdをkeyにしてSubscribeLayerを再マウント
  // userIdがnullの場合はSubscribeLayerをマウントしない
  return (
    <>
      {userId ? <SubscribeLayer key={userId} /> : null}
      {children}
    </>
  );
}
