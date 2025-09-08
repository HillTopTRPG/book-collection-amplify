import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          書籍コレクション
        </h1>
        <p className="text-gray-600 text-center mb-8">
          バーコードを読み取って書籍情報を取得・管理できます
        </p>
        
        <div className="space-y-4">
          <Link
            to="/scanner"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            📖 バーコード読み取り
          </Link>
          
          <Link
            to="/collection"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            📚 コレクション一覧
          </Link>
        </div>
      </div>
    </div>
  )
}