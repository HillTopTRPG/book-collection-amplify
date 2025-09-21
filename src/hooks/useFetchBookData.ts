// const _fetchBookData = async (isbn: Isbn13): Promise<BookData> => {
//   const ndlBooksApiResult = (await fetchNdlSearch({ isbn }))?.at(0);
//   if (ndlBooksApiResult) return ndlBooksApiResult;
//
//   return [
//     await fetchOpenBdApi(isbn),
//     await fetchGoogleBooksApi(isbn),
//     (await fetchRakutenBooksApi({ isbn })).at(0),
//   ].reduce<BookData>(
//     (acc, cur) => {
//       if (!cur) return acc;
//       const listProperty = ['creator', 'ndcLabels', 'isbn'] as const;
//       getKeys(omit(cur, listProperty)).forEach(property => {
//         if (!acc[property] && cur[property]) acc[property] = cur[property];
//       });
//       getKeys(
//         pick(
//           cur,
//           listProperty.filter(p => p !== 'isbn')
//         )
//       ).forEach(property => {
//         if (!acc[property] && cur[property]) acc[property] = cur[property];
//       });
//       return acc;
//     },
//     { isbn, ndcLabels: [] }
//   );
// };

// export default function useFetchBookData() {
//   const collections = useAppSelector(selectCollections);
//   const dbFilterSets = useAppSelector(selectFilterSets);
//   const filterQueueResults = useAppSelector(selectNdlSearchQueueResults);
//
//   const fetchBookData = useCallback(
//     async (isbn: Isbn13): Promise<ScannedItemMapValue> => {
//       console.log('fetchBookData', isbn);
//       const book = await _fetchBookData(isbn);
//       const scannedItemMapValue = getScannedItemMapValueByBookData(collections, book);
//       const _filterSets: FilterSet[] = dbFilterSets.filter(
//         filterSet => filterQueueResults[JSON.stringify(filterSet.fetch)]
//       );
//       const wrappedFilterSets =
//         _filterSets.length > 0
//           ? _filterSets
//           : [
//               {
//                 id: '',
//                 name: book.title ?? '無名のフィルター',
//                 fetch: {
//                   title: book.title ?? '無名',
//                   publisher: book.publisher ?? '',
//                   creator: book.creator?.at(0) ?? '',
//                   usePublisher: true,
//                   useCreator: true,
//                 },
//                 filters: [],
//                 createdAt: '',
//                 updatedAt: '',
//                 owner: '',
//               } as const satisfies FilterSet,
//             ];
//
//       // 書籍データが取得できたかどうかはタイトルが取得できたかで判定する
//       if (book.title && !scannedItemMapValue.filterSets.length) {
//         scannedItemMapValue.filterSets.push(...wrappedFilterSets);
//       }
//
//       return scannedItemMapValue;
//     },
//     [collections, dbFilterSets, filterQueueResults]
//   );
//
//   return {
//     fetchBookData,
//   };
// }
