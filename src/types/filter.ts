export type FilterData = {
  type: 'title' | 'author' | 'publisher' | 'pubdate';
  value: string;
  sortOrder: 'asc' | 'desc';
};
