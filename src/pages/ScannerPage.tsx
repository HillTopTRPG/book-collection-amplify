import WebCameraComponent from '../WebCameraComponent.tsx';
import ScannedResults from '@/ScannedResults.tsx';

export default function ScannerPage() {
  return (
    <div className="flex flex-col w-full flex-1 gap-4 p-4">
      <WebCameraComponent width={300} height={100} />
      <ScannedResults />
    </div>
  );
}