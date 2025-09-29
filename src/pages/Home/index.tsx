import { useAuthenticator } from '@aws-amplify/ui-react';
import { Barcode, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuthenticator(context => [context.user]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen min-h-dvh p-4">
      <div className="max-w-md w-full bg-background rounded-lg shadow-lg p-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">マイ書目コンシェルジュ</h1>
          <p className="text-sm">ようこそ、{user.signInDetails?.loginId}さん</p>
        </div>

        <p className="text-center mb-8">バーコードを読み取って書籍情報を取得・管理できます</p>

        <div className="space-y-4">
          <Link
            to="/scan"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Barcode />
            <span>バーコードスキャン</span>
          </Link>

          <Link
            to="/collection"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <BookOpen />
            <span>コレクション一覧</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
