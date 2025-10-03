import { useEffect, useRef } from 'react';
import { store } from '@/store';
import { getNgramCacheSize } from '@/utils/stringSimilarity.ts';

type UseLogsOptions = {
  /** コンポーネント名 */
  componentName: string;
  /** 追加情報（例: ISBN、ID等） */
  additionalInfo?: string;
  /** アンマウント時のクリーンアップ処理 */
  onUnmount?: () => void;
  /** 詳細ログを出力するかどうか（メモリ、Redux store、N-gramキャッシュ） */
  includeDetailedMetrics?: boolean;
};

/**
 * パフォーマンスログを出力するカスタムフック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useLogs({ componentName: 'MyComponent', additionalInfo: 'id=123' });
 *   // ...
 * }
 * ```
 */
export const useLogs = (options: UseLogsOptions) => {
  const { componentName, additionalInfo, onUnmount, includeDetailedMetrics = false } = options;

  const mountTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  // レンダリングごとのログ出力
  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - mountTimeRef.current;

    // 基本ログ
    let logMessage = `[${componentName}] Render #${renderCountRef.current} completed in ${renderTime.toFixed(2)}ms`;

    if (additionalInfo) {
      logMessage += ` (${additionalInfo})`;
    }

    // 詳細メトリクスを含める場合
    if (includeDetailedMetrics) {
      // メモリ使用量を計測（Chrome/Edge のみ）
      const memory = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const memoryInfo = memory
        ? `Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        : 'Memory: N/A';

      // Redux store全体のデータ容量を計測（store.getState()で直接取得して再レンダリングを防ぐ）
      const rootState = store.getState();
      const storeJsonSize = new Blob([JSON.stringify(rootState)]).size;
      const storeSizeInKB = (storeJsonSize / 1024).toFixed(2);
      const storeSizeInMB = (storeJsonSize / 1024 / 1024).toFixed(2);
      const storeSizeInfo = storeJsonSize > 1024 * 1024 ? `${storeSizeInMB}MB` : `${storeSizeInKB}KB`;

      // キャッシュサイズを計測
      const ngramCacheSize = getNgramCacheSize();

      logMessage += ` | ${memoryInfo} | Redux store: ${storeSizeInfo} | N-gram cache: ${ngramCacheSize}`;

      // 初回レンダリングの場合、詳細ログを出力
      if (renderCountRef.current === 1) {
        console.log(`[${componentName}] Initial mount completed in ${renderTime.toFixed(2)}ms | ${memoryInfo}`);
      }
    }

    console.log(logMessage);
  });

  // アンマウント時の計測とクリーンアップ
  useEffect(() => {
    const mountTime = mountTimeRef.current;

    return () => {
      const totalTime = performance.now() - mountTime;
      console.log(
        `[${componentName}] Unmounted after ${totalTime.toFixed(2)}ms, ${renderCountRef.current} renders (avg: ${(totalTime / renderCountRef.current).toFixed(2)}ms/render)`
      );

      // カスタムクリーンアップ処理を実行
      if (onUnmount) {
        onUnmount();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName]);
};
