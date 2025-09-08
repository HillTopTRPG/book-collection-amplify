import WebCameraComponent from '../WebCameraComponent.tsx'
import { Link } from 'react-router-dom'

export default function ScannerPage() {
  return (
    <main className="p-1">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200"
        >
          ← ホームに戻る
        </Link>
      </div>
      
      <div className="flex gap-3 items-start">
        <WebCameraComponent width={300} height={200} />
      </div>
    </main>
  )
}