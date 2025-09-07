import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import {checkIsdnCode} from './utils/validate.ts'
import ScannedResults from './ScannedResults.tsx'
import {useDispatch} from 'react-redux'
import {AppDispatch} from './store'
import {addScannedItem} from './store/scannerSlice.ts'
import {fetchBookDataThunk} from './store/scannerThunks.ts'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

type Props = {
  width: number;
  height: number;
};

const WebCameraComponent = ({ width, height }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
        audio: false
      });
      
      setStream(mediaStream);
      
      // if (videoRef.current) {
      //   videoRef.current.srcObject = mediaStream;
      // }

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
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: "environment" // スマホの場合は背面カメラを優先
            },
          },
          frequency: 10, // スキャン頻度を下げる
          numOfWorkers: navigator.hardwareConcurrency || 2,
          decoder: {
            readers: ['ean_reader']
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
        
        // トーストを表示
        toast({
          title: "ISBN検出成功",
          description: `ISBN: ${code} を検出しました`,
          duration: 3000,
        });
        
        dispatch(addScannedItem({ isbn: code }));
        dispatch(fetchBookDataThunk(code));
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
    
    // if (videoRef.current) {
    //   videoRef.current.srcObject = null;
    // }
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
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center">
        <h2>Webカメラ & バーコードリーダー</h2>

        <Button
          onClick={stream ? stopCamera : startCamera}
          disabled={isLoading}
          className="mb-2"
          variant={stream ? 'destructive' : 'default'}
        >
          {isLoading ? 'カメラ起動中...' : stream ? 'カメラ停止' : 'カメラ開始'}
        </Button>

        {error && (
          <div style={{ color: 'red', marginBottom: '20px' }}>
            エラー: {error}
          </div>
        )}

        <div
          id="scanner-container"
          ref={scannerRef}
          className=""
          style={{
            display: isScanning ? 'block' : 'none',
            width: width + 'px',
            border: `${isScanning ? '2px' : '0'} solid #51cf66`,
          }}
        />

        {stream && !isScanning && (
          <p style={{ marginTop: '10px', color: 'orange' }}>
            スキャナー準備中...
          </p>
        )}

      </div>
      <ScannedResults />
    </div>
  );
};

export default WebCameraComponent;