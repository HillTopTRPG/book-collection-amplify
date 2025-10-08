import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { NdlFetchOptions } from '@/types/fetch.ts';

// NdlFullOptionsのキャッシュ（計算コスト削減）
const ndlOptionsStringCache = new WeakMap<NdlFullOptions, string>();

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  // キャッシュがあればそれを返す
  const cached = ndlOptionsStringCache.get(ndlFullOptions);
  if (cached !== undefined) {
    return cached;
  }

  const requestOptions: NdlFetchOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  const result = JSON.stringify(requestOptions);
  ndlOptionsStringCache.set(ndlFullOptions, result);
  return result;
};
