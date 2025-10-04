import type { NdlFullOptions } from '@/components/NdlOptionsForm.tsx';
import type { Values } from '@/utils/type.ts';
import type { Schema } from '$/amplify/data/resource.ts';
import type { ClassValue } from 'clsx';
import { getKeys } from '@/utils/type.ts';

export type Isbn13 = string & { readonly __brand: 'Isbn13' };

// 書籍データの型定義
export type BookData = {
  apiId: string;
  isbn: Isbn13;
  title?: string | null;
  volume?: string | null;
  volumeTitle?: string | null;
  creator?: string[];
  seriesTitle?: string | null;
  edition?: string | null;
  publisher?: string | null;
  date?: string | null;
  ndc?: string | null;
  ndcLabels: string[];
  cover?: string | null;
  extent?: string | null;
};

export const BookStatusEnum = {
  // 未登録
  Unregistered: 'Unregistered',
  // 買わない
  NotBuy: 'NotBuy',
  // 保留
  Hold: 'Hold',
  // 購入予定
  Planned: 'Planned',
  // 所持済
  Owned: 'Owned',
} as const;

export const isBookStatus = (str: string): str is BookStatus =>
  getKeys(BookStatusEnum).some(key => BookStatusEnum[key] === str);

export type BookStatus = Values<typeof BookStatusEnum>;

export const BookStatusLabelMap: Record<BookStatus, { label: string; className: ClassValue }> = {
  [BookStatusEnum.Unregistered]: { label: '未登録', className: 'bg-yellow-700 text-white' },
  [BookStatusEnum.NotBuy]: { label: '買わない', className: 'bg-gray-700 text-white' },
  [BookStatusEnum.Hold]: { label: '保留', className: 'bg-green-700 text-white' },
  [BookStatusEnum.Planned]: { label: '購入予定', className: 'bg-fuchsia-900 text-white' },
  [BookStatusEnum.Owned]: { label: '所持済', className: 'bg-blue-600 text-white' },
} as const;

export type Collection = Omit<Schema['Collection']['type'], 'status'> & {
  status: BookStatus;
};

export type CollectionBook = Collection & BookData;
export type FilterResultSet = { filterSet: FilterSet; collectionBooks: CollectionBook[] };

export type Sign = '==' | '*=' | '!=' | '!*';
export type FilterBean = { keyword: string; sign: Sign };
export type FilterAndGroup = { list: FilterBean[]; groupByType: 'volume' | null };

export type FilterSet = Omit<Schema['FilterSet']['type'], 'fetch' | 'filters'> & {
  fetch: NdlFullOptions;
  filters: FilterAndGroup[];
};
