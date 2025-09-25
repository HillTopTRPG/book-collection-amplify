export type NdlFetchOptions = {
  title?: string;
  creator?: string;
  publisher?: string;
  isbn?: string;
  dpid?: string;
  mediatype?: string;
  anywhere?: string;
  startRecord?: number;
};

export type RakutenApiOption = {
  title?: string;
  author?: string;
  publisherName?: string;
  size?: number;
  isbn?: string;
  booksGenreId?: string;
  sort?: '+releaseDate' | '-releaseDate';
  applicationId?: string;
  page?: number;
};
