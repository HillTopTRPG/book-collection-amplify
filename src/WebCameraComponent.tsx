import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

function checkIsdnCode(code: string | null) {
  if (code?.length !== 13) return false;

  const checkDigit = parseInt(code.slice(-1)); // バーコードからチェックディジットを抽出する
  const barcodeDigits = code.slice(0, -1).split(""); // チェックディジットを除いたバーコードの桁を抽出する

  let sum = 0;
  for (let i = 0; i < barcodeDigits.length; i++) {
    if (i % 2 === 0) {
      sum += parseInt(barcodeDigits[i]); // 奇数桁を足す
    } else {
      sum += 3 * parseInt(barcodeDigits[i]); // 偶数桁を3倍する
    }
  }

  return (sum + checkDigit) % 10 === 0
}

interface WebCameraComponentProps {
  width?: number;
  height?: number;
}

const WebCameraComponent = ({ width = 640, height = 480 }: WebCameraComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [latestCode, setLatestCode] = useState<string>("");

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

  const startBarcodeScanning = async () => {
    console.log('バーコードスキャン開始を試行中...');
    setIsScanning(true);
    setError(null);

    // DOMの準備を待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!scannerRef.current) {
      console.error('scannerRef.currentが存在しません');
      setError('スキャナーの要素が見つかりません。もう一度お試しください。');
      setIsScanning(false);
      return;
    }
    
    try {
      await new Promise<void>((resolve, reject) => {
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current ?? undefined,
            constraints: {
              width: { min: 300 },
              height: { min: 200 },
              facingMode: "environment" // スマホの場合は背面カメラを優先
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 2,
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader", 
              "code_39_reader"
            ]
          },
          locate: true
        }, (err) => {
          if (err) {
            console.error('Quagga初期化エラー:', err);
            setError(`バーコードスキャナーの初期化に失敗しました: ${err.message || err}`);
            setIsScanning(false);
            reject(err);
            return;
          }
          console.log('Quagga初期化完了');
          resolve();
        });
      });

      // 初期化が成功したらスキャンを開始
      Quagga.start();
      console.log('Quaggaスキャン開始');

      // イベントリスナーを設定
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        console.log('バーコード検出:', code);

        if (!code || !checkIsdnCode(code)) {
          return;
        }

        setLatestCode(code);
        setScannedCodes(prev => {
          if (!prev.includes(code)) {
            return [code, ...prev].slice(0, 10); // 最新10件を保持
          }
          return prev;
        });
      });

    } catch (error) {
      console.error('スキャナー開始エラー:', error);
      setError(`スキャナーの開始に失敗しました: ${error}`);
      setIsScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    if (isScanning) {
      Quagga.stop();
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    stopBarcodeScanning();
    
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
      stopBarcodeScanning();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Webカメラ & バーコードリーダー</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={startCamera} disabled={isLoading || !!stream}>
          {isLoading ? 'カメラ起動中...' : 'カメラ開始'}
        </button>
        <button onClick={stopCamera} disabled={!stream} style={{ marginLeft: '10px' }}>
          カメラ停止
        </button>
        {stream && (
          <button 
            onClick={isScanning ? stopBarcodeScanning : startBarcodeScanning}
            disabled={!stream}
            style={{ marginLeft: '10px', backgroundColor: isScanning ? '#ff6b6b' : '#51cf66' }}
          >
            {isScanning ? 'スキャン停止' : 'バーコードスキャン開始'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          エラー: {error}
        </div>
      )}

      <div style={{ 
        position: 'relative', 
        display: 'inline-block',
        width: width + 'px',
        height: height + 'px',
        border: `2px solid ${isScanning ? '#51cf66' : '#ccc'}`,
        borderRadius: '8px',
        backgroundColor: '#f0f0f0'
      }}>
        <video
          ref={videoRef}
          width={width}
          height={height}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '6px',
            objectFit: 'cover',
            display: isScanning ? 'none' : 'block'
          }}
        />
        
        <div
          ref={scannerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '6px',
            display: isScanning ? 'block' : 'none'
          }}
        />
      </div>
      
      {stream && !isScanning && (
        <p style={{ marginTop: '10px', color: 'green' }}>
          カメラが正常に動作しています
        </p>
      )}
      
      {isScanning && (
        <p style={{ marginTop: '10px', color: 'blue' }}>
          バーコードをスキャン中...
        </p>
      )}

      {/* スキャン結果の表示 */}
      {latestCode && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          border: '2px solid #51cf66',
          borderRadius: '8px'
        }}>
          <h3>最新スキャン結果</h3>
          <p style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            margin: '10px 0',
            fontFamily: 'monospace'
          }}>
            {latestCode}
          </p>
        </div>
      )}

      {scannedCodes.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '8px'
        }}>
          <h4>スキャン履歴 (最新{scannedCodes.length}件)</h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            margin: '10px 0'
          }}>
            {scannedCodes.map((code, index) => (
              <li key={index} style={{ 
                padding: '5px 10px',
                margin: '5px 0',
                backgroundColor: index === 0 ? '#e8f5e8' : '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                {code}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => {
              setScannedCodes([]);
              setLatestCode("");
            }}
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            履歴クリア
          </button>
        </div>
      )}
    </div>
  );
};

export default WebCameraComponent;