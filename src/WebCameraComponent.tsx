import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import {BookData} from './types/book.ts'
import {fetchBookData} from './utils/fetch.ts'
import {checkIsdnCode} from './utils/validate.ts'

type Props = {
  width?: number;
  height?: number;
};

const WebCameraComponent = ({ width = 640, height = 480 }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDataList, setScannedDataList] = useState<{ isbn: string; data: BookData | null }[]>([]);

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

      // カメラ起動後、少し待ってからバーコードスキャンを自動開始
      setTimeout(() => {
        startBarcodeScanning();
      }, 1000);

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
      Quagga.onDetected(async (result) => {
        const code = result.codeResult.code;
        console.log('バーコード検出:', code);

        if (!code || !checkIsdnCode(code)) {
          return;
        }

        // 既にスキャン済みの場合はスキップ
        if (scannedDataList.some(({ isbn }) => isbn === code)) {
          return;
        }

        const scannedData = { isbn: code, data: null };
        const newList = [scannedData, ...scannedDataList].slice(0, 10);
        setScannedDataList(newList); // 最新10件を保持

        fetchBookData(code).then((book) => {
          const idx = newList.findIndex(data => data.isbn === code);
          newList.splice(idx, 1, {...newList[idx], data: book});
          setScannedDataList(newList);
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
      if (isScanning) {
        Quagga.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, isScanning]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Webカメラ & バーコードリーダー</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={stream ? stopCamera : startCamera} 
          disabled={isLoading}
          style={{ 
            backgroundColor: stream ? '#ff6b6b' : '#51cf66',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'カメラ起動中...' : stream ? 'カメラ停止' : 'カメラ開始'}
        </button>
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
        <p style={{ marginTop: '10px', color: 'orange' }}>
          スキャナー準備中...
        </p>
      )}

      {scannedDataList.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '8px'
        }}>
          <h4>📚 スキャン履歴 (最新{scannedDataList.length}件)</h4>
          <div style={{ margin: '10px 0' }}>
            {scannedDataList.map(({ isbn, data: book }, index) => (
              <div key={index} style={{ 
                padding: '10px',
                margin: '8px 0',
                backgroundColor: index === 0 ? '#e8f5e8' : '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div>ISBNコード: {isbn}</div>
                  {
                    book && (
                      <>
                        {book?.cover && (
                          <img
                            src={book.cover}
                            alt="表紙"
                            style={{
                              width: '50px',
                              height: '75px',
                              objectFit: 'cover',
                              borderRadius: '3px',
                              border: '1px solid #ddd'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
                            {book.title}
                          </h5>
                          <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                            {book.author} / {book.publisher}
                          </p>
                          <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#999', margin: '4px 0 0 0' }}>
                            {book.isbn}
                          </p>
                        </div>
                      </>
                    )
                  }
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              setScannedDataList([]);
            }}
            style={{ 
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
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