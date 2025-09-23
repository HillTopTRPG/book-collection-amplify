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

export const checkImageExists = async (url: string | null | undefined) =>
  new Promise<boolean>(resolve => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
