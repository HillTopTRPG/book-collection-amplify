import type { Isbn13 } from '@/types/book.ts';
import Quagga from '@ericblade/quagga2';
import { Volume2, VolumeOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSound from 'use-sound';
import { useInterval } from 'usehooks-ts';
import se01 from '@/assets/se01.mp3';
import { Button } from '@/components/ui/button.tsx';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueScan, selectScanSuccessCount, selectSelectedCollectionBook } from '@/store/scannerSlice.ts';
import { getIsbn13, getIsbnCode } from '@/utils/isbn.ts';
import CornerFrame from './CornerFrame.tsx';

const WIDTH = 300;
const HEIGHT = 100;

export default function CameraView() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const scannedBooks = useAppSelector(selectScanSuccessCount);
  const selectedBookData = useAppSelector(selectSelectedCollectionBook);
  const [lastFetchedBookListCount, setLastFetchedBookListCount] = useState<number>(scannedBooks);
  const scannerRef = useRef<HTMLDivElement>(null);
  const lastFetchIsbn = useRef<Isbn13 | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFirst, setIsFirst] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [volume, _setVolume] = useState('volume' in localStorage ? Number(localStorage['volume']) : 0.8);
  const [play] = useSound(se01, {
    volume,
    interrupt: true,
  });

  // cameraEnabledが更新されたら、初回フラグを立てる
  useEffect(() => {
    setIsFirst(true);
  }, [selectedBookData]);

  const setVolume = useCallback((volume: number) => {
    localStorage.volume = volume;
    _setVolume(volume);
  }, []);

  useEffect(() => {
    if (lastFetchedBookListCount !== scannedBooks) {
      if (scannedBooks > 0) {
        // fetch済みリストの件数が変化するたびに音を鳴らす
        try {
          play();
        } catch {
          console.error('音声再生エラー');
        }
      } else {
        // 0件になったらリセットする
        lastFetchIsbn.current = null;
      }
    }
    setLastFetchedBookListCount(scannedBooks);
  }, [scannedBooks, lastFetchedBookListCount, play]);

  // Quagga.onDetectedハンドラーをuseCallbackで作成（メモリリーク防止のため参照を安定化）
  const handleDetected = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result: any) => {
      const maybeIsbn = getIsbnCode(result.codeResult.code);
      if (!maybeIsbn) return;

      const isbn13 = getIsbn13(maybeIsbn);

      if (lastFetchIsbn.current === isbn13) return;
      lastFetchIsbn.current = isbn13;

      console.log('バーコード検出:', isbn13);

      // トーストを表示
      toast({
        title: 'ISBN検出',
        description: isbn13,
        duration: 2000,
      });

      dispatch(enqueueScan({ type: 'new', list: [isbn13] }));
    },
    [dispatch, toast]
  );

  const startBarcodeScanning = useCallback(async () => {
    console.log('バーコードスキャン開始を試行中...');
    setIsScanning(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = await new Promise<any>(resolve => {
      void Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: scannerRef.current ?? undefined,
            constraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: 'environment', // スマホの場合は背面カメラを優先
            },
          },
          frequency: 10, // スキャン頻度を下げる
          numOfWorkers: navigator.hardwareConcurrency || 2,
          decoder: {
            readers: ['ean_reader'],
          },
          locate: true,
        },
        err => {
          if (err) {
            resolve(err);
            return;
          }
          resolve(null);
        }
      );
    });

    if (error !== null) {
      console.error('Quagga初期化エラー:', error);
      setError(`バーコードスキャナーの初期化に失敗しました: ${error}`);
      setIsScanning(false);
      return;
    }

    // 初期化が成功したらスキャンを開始
    Quagga.start();
    console.log('Quaggaスキャン開始');

    // イベントリスナーを設定（handleDetectedを使用）
    Quagga.onDetected(handleDetected);

    setError(null);
    setIsScanning(true);
  }, [handleDetected]);

  const startCamera = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: WIDTH, height: HEIGHT },
        audio: false,
      });
      setStream(stream);

      // カメラ起動後、少し待ってからバーコードスキャンを自動開始
      setTimeout(() => {
        void startBarcodeScanning();
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カメラにアクセスできませんでした';
      setError(errorMessage);
      console.error('カメラアクセスエラー:', err);
    }
  }, [startBarcodeScanning]);

  const stopCamera = useCallback(async () => {
    // Quaggaのイベントリスナーを解除（メモリリーク防止）
    Quagga.offDetected(handleDetected);
    await Quagga.stop();
    stream?.getTracks().forEach(track => track.stop());
    setIsScanning(false);
  }, [handleDetected, stream]);

  // コンポーネントマウント時に自動でカメラを起動
  useInterval(() => {
    if (!isFirst) return;
    if (!scannerRef.current) return;
    if (selectedBookData) {
      void stopCamera();
    } else {
      void startCamera();
    }
    setIsFirst(false);
  }, 100);

  const toggleVolume = useCallback(() => {
    setVolume(volume ? 0 : 0.8);
  }, [setVolume, volume]);

  // コンポーネントのアンマウント時にクリーンアップ（メモリリーク防止）
  useEffect(
    () => () => {
      // Quaggaのイベントリスナーを解除
      Quagga.offDetected(handleDetected);
      void Quagga.stop().then(() => {
        // カメラストリームを停止
        stream?.getTracks().forEach(track => track.stop());
        console.log('[CameraView] クリーンアップ完了');
      });
    },
    [handleDetected, stream]
  );

  return (
    <div className="flex flex-col items-center justify-normal bg-background p-1 relative">
      {error ? <div style={{ color: 'red', marginBottom: '20px' }}>エラー: {error}</div> : null}

      {stream && isScanning ? (
        <Button
          className="absolute outline-white outline bg-foreground active:bg-foreground focus:bg-foreground text-background active:text-background focus:text-background border-foreground active:border-foreground focus:border-foreground right-[3px] top-[3px] rounded-full z-40"
          size="icon"
          variant="outline"
          onClick={toggleVolume}
        >
          {volume ? <Volume2 /> : <VolumeOff />}
        </Button>
      ) : null}

      <div
        id="scanner-container"
        ref={scannerRef}
        className="overflow-hidden relative rounded-lg"
        style={{
          minWidth: '300px',
          maxWidth: '300px',
          minHeight: '100px',
          maxHeight: '100px',
        }}
      >
        <h1 className="absolute top-1 left-0 right-0 text-center text-xs text-white z-40">
          バーコードを写してください。
        </h1>
        {isScanning ? null : (
          <p className="absolute inset-0 bg-background flex items-center justify-center z-40">
            <Spinner variant="bars" />
          </p>
        )}
        <CornerFrame />
      </div>
    </div>
  );
}
