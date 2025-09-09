import WebCameraComponent from '../WebCameraComponent.tsx';
import ScannedResults from '@/ScannedResults.tsx';

export default function ScannerPage() {
  return (
    <div className="flex flex-col w-full flex-1 gap-4 p-4">
      <h1 className="text-2xl font-bold text-white text-center mt-2">
        書籍登録
      </h1>
      <WebCameraComponent width={300} height={200} />
      <ScannedResults />
    </div>
  );
}