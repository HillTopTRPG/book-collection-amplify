import { useEffect, useRef, useState, useCallback } from 'react';

import Quagga from '@ericblade/quagga2';
import { Volume2, VolumeOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import useSound from 'use-sound';
import { useInterval } from 'usehooks-ts';

import se01 from '@/assets/se01.mp3';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/hooks/use-toast';
import { AppDispatch } from '@/store';
import { useAppSelector } from '@/store/hooks.ts';
import { selectFetchedBookList } from '@/store/scannerSlice.ts';
import { fetchBookDataThunk } from '@/store/scannerThunks.ts';
import { checkIsdnCode } from '@/utils/validate.ts';


import CornerFrame from './CornerFrame.tsx';



type Props = {
  width: number;
  height: number;
};

export default function CameraView({ width, height }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const fetchedBookList = useAppSelector(selectFetchedBookList);
  const [lastFetchedBookListCount, setLastFetchedBookListCount] = useState(fetchedBookList.length);
  const scannerRef = useRef<HTMLDivElement>(null);
  const lastFetchIsbn = useRef<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFirst, setIsFirst] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [volume, _setVolume] = useState(Number(localStorage.volume) ?? 0.8);
  const [play] = useSound(se01, {
    volume,
    interrupt: true
  });

  const setVolume = (volume: number) => {
    localStorage.volume = volume;
    _setVolume(volume);
  };

  useEffect(() => {
    if (lastFetchedBookListCount !== fetchedBookList.length && fetchedBookList.length > 0) {
      // SEを再生
      try {
        play();
      } catch {
        console.error('音声再生エラー');
      }
    }
    setLastFetchedBookListCount(fetchedBookList.length);
  }, [fetchedBookList.length, lastFetchedBookListCount, play]);

  const startBarcodeScanning = useCallback(async () => {
    console.log('バーコードスキャン開始を試行中...');
    setIsScanning(true);
    setError(null);

    // DOMの準備を待つ
    await new Promise(resolve => setTimeout(resolve, 300));

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
            name: 'Live',
            type: 'LiveStream',
            target: scannerRef.current ?? undefined,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: 'environment' // スマホの場合は背面カメラを優先
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

        if (!code || !checkIsdnCode(code)) {
          return;
        }

        console.log('バーコード検出:', code);

        if (lastFetchIsbn.current === code) return;
        lastFetchIsbn.current = code;

        // トーストを表示
        toast({
          title: 'ISBN検出',
          description: `${code}`,
          duration: 2000,
        });

        dispatch(fetchBookDataThunk(code));
      });
      setError(null);
      setIsScanning(true);

    } catch (error) {
      console.error('スキャナー開始エラー:', error);
      setError(`スキャナーの開始に失敗しました: ${error}`);
      setIsScanning(false);
    }
  }, [dispatch, toast]);

  const startCamera = useCallback(async () => {
    setIsFirst(false);
    setIsLoading(true);
    setError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width, height },
        audio: false
      });
      
      setStream(mediaStream);

      // カメラ起動後、DOM要素が準備されるまで待ってからバーコードスキャンを自動開始
      setTimeout(() => {
        if (scannerRef.current) {
          startBarcodeScanning();
        }
      }, 500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カメラにアクセスできませんでした';
      setError(errorMessage);
      console.error('カメラアクセスエラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, [width, height, startBarcodeScanning]);

  // コンポーネントマウント時に自動でカメラを起動
  useInterval(() => {
    if (!isFirst) return;
    startCamera().then();
  }, 100);

  useEffect(() => {
    return () => {
      if (isScanning) {
        Quagga.stop().then();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, isScanning]);

  return (
    <div className="flex flex-col items-center justify-normal bg-background rounded-lg shadow-lg p-1 relative">
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          エラー: {error}
        </div>
      )}

      {stream && isScanning && (
        <Button className="absolute bg-foreground active:bg-foreground focus:bg-foreground text-background active:text-background focus:text-background border-foreground active:border-foreground focus:border-foreground right-[3px] top-[3px] rounded-full z-40" size="icon" variant="outline" onClick={() => {
          setVolume(volume ? 0 : 0.8);
        }}>
          {volume ? <Volume2 /> : <VolumeOff />}
        </Button>
      )}

      <div
        id="scanner-container"
        ref={scannerRef}
        className="overflow-hidden relative rounded-lg"
        style={{
          maxWidth: '300px',
          maxHeight: '100px',
        }}
      >
        <h1 className="absolute top-1 left-0 right-0 text-center text-xs text-white z-40">バーコードを写してください。</h1>
        <CornerFrame />
      </div>

      {isLoading && (
        <p className="p-2 text-blue-400 bg-blue-50">
          カメラ起動中...
        </p>
      )}

      {stream && !isScanning && (
        <p className="p-2 text-blue-400 bg-blue-50">
          スキャナー準備中...
        </p>
      )}
    </div>
  );
}
