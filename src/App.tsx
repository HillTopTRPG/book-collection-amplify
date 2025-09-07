import WebCameraComponent from './WebCameraComponent.tsx'

function App() {

  return (
    <main style={{ padding: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
        <div>
          <WebCameraComponent width={480} height={360} />
        </div>
      </div>
    </main>
  );
}

export default App;
