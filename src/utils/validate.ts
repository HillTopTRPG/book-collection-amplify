import { getIsbn10CheckDigit, getIsbn13CheckDigit } from '@/utils/primitive.ts';

export const checkIsbnCode = (code: string | null): code is string => {
  if (!code || ![10, 13].some(v => v === code.length)) return false;

  const isbnPart = code.slice(0, -1);

  if (code.length === 13) {
    return `${isbnPart}${getIsbn13CheckDigit(isbnPart)}` === code;
  }

  return `${isbnPart}${getIsbn10CheckDigit(isbnPart)}` === code;
};
