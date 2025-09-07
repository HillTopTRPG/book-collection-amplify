import { useEffect, useRef, useState } from "react";

interface WebCameraComponentProps {
  width?: number;
  height?: number;
}

const WebCameraComponent = ({ width = 640, height = 480 }: WebCameraComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カメラにアクセスできませんでした';
      setError(errorMessage);
      console.error('カメラアクセスエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Webカメラ</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={startCamera} disabled={isLoading || !!stream}>
          {isLoading ? 'カメラ起動中...' : 'カメラ開始'}
        </button>
        <button onClick={stopCamera} disabled={!stream} style={{ marginLeft: '10px' }}>
          カメラ停止
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          エラー: {error}
        </div>
      )}

      <div>
        <video
          ref={videoRef}
          width={width}
          height={height}
          autoPlay
          muted
          playsInline
          style={{
            border: '2px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f0f0f0'
          }}
        />
      </div>
      
      {stream && (
        <p style={{ marginTop: '10px', color: 'green' }}>
          カメラが正常に動作しています
        </p>
      )}
    </div>
  );
};

export default WebCameraComponent;