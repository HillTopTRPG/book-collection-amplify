import type { Isbn13 } from '@/types/book.ts';
import { deleteAllStrings, getIsbn13, unique } from '@/utils/primitive.ts';

const LocalStorageKeys = {
  // スキャンしたISBNコードの配列
  scan: 'scan',
};

export const getScannedIsbnToLocalStorage = (): Isbn13[] => {
  const scanListText = localStorage.getItem(LocalStorageKeys.scan);
  const maybeIsbn13List: string[] = !scanListText ? [] : JSON.parse(scanListText);

  return maybeIsbn13List.map(getIsbn13);
};

export const pushScannedIsbnToLocalStorage = (isbnList: Isbn13[]) => {
  const list = getScannedIsbnToLocalStorage();
  list.push(...isbnList);
  localStorage.setItem(LocalStorageKeys.scan, JSON.stringify(unique(list)));
};

export const deleteScannedIsbnToLocalStorage = (isbnList: Isbn13[]) => {
  const list = getScannedIsbnToLocalStorage();
  deleteAllStrings(list, isbnList);
  localStorage.setItem(LocalStorageKeys.scan, JSON.stringify(list));
};

export const resetScannedIsbnToLocalStorage = () => {
  localStorage.setItem(LocalStorageKeys.scan, '[]');
};
