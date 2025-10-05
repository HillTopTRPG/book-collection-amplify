import type { Isbn13 } from '@/types/book.ts';

export type FetchProcessResult<T> = { value: T; retry: boolean; error: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchData = async (url: string): Promise<{ data: any; retry: boolean; error: string | null }> => {
  try {
    const response = await fetch(url);
    if (response.status === 429) {
      console.log('Too Many Requests', url);
      return { data: null, error: 'Too Many Requests', retry: true };
    }
    return { data: await response.json(), error: null, retry: false };
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    return { data: null, error: 'network?', retry: false };
  }
};

/**
 * NDLの書影APIはCORS制限が効いているので、描画できたかどうかしか判定できない
 * @param isbn
 */
export const getNdlBookImage = async (isbn: Isbn13 | null): Promise<string | null> => {
  if (!isbn) return null;

  return new Promise<string | null>(resolve => {
    const src = `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`;
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};
