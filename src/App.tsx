import WebCameraComponent from './WebCameraComponent.tsx'

function App() {

  return (
    <main className="p-1">
      <div className="flex gap-3 items-start">
        <WebCameraComponent width={300} height={147} />
      </div>
    </main>
  );
}

export default App;
