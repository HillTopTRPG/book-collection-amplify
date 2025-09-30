import CameraView from './CameraView';
import IsbnForm from './IsbnForm.tsx';
import ScannedResults from './ScannedResults';

export default function ScanPage() {
  return (
    <div className="flex flex-col w-full flex-1">
      <div className="m-2 rounded-md overflow-hidden p-2 bg-background">
        <CameraView />
        <IsbnForm />
      </div>
      <ScannedResults />
    </div>
  );
}
