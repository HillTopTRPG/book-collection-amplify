import WebCameraComponent from './WebCameraComponent.tsx'
import { Toaster } from '@/components/ui/toaster'

function App() {

  return (
    <main className="p-1">
      <div className="flex gap-3 items-start">
        <WebCameraComponent width={300} height={147} />
      </div>
      <Toaster />
    </main>
  );
}

export default App;
