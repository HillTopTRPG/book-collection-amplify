import IsbnForm from '@/pages/ScannerPage/IsbnForm.tsx';
import CameraView from './CameraView';
import ScannedResults from './ScannedResults';

export default function ScannerPage() {
  return (
    <div className="flex flex-col w-full flex-1 gap-4 p-4">
      <CameraView width={300} height={100} />
      <IsbnForm />
      <ScannedResults />
    </div>
  );
}
