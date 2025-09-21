import { getIsbn10CheckDigit, getIsbn13CheckDigit } from '@/utils/primitive.ts';

export const checkIsbnCode = (code: string | null): code is string => {
  if (!code || ![10, 13].some(v => v === code.length)) return false;
  if (code.length === 13 && !/^[0-9]{13}$/.test(code)) return false;
  if (code.length === 10 && !/^[0-9]{9}[0-9X]$/.test(code)) return false;

  const isbnPart = code.slice(0, -1);

  if (code.length === 13) {
    return `${isbnPart}${getIsbn13CheckDigit(isbnPart)}` === code;
  }

  return `${isbnPart}${getIsbn10CheckDigit(isbnPart)}` === code;
};

export const checkQueueExists = <T extends string>(key: T, queueList: T[], results: Record<T, unknown>) => {
  const queue = queueList.includes(key);
  const result = results[key] !== undefined;

  return queue || result ? { queue, result, both: queue && result } : null;
};
