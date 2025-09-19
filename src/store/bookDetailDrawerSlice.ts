// import { createSelector, createSlice } from '@reduxjs/toolkit';
//
// import { selectFetchedBookList } from '@/store/scannerSlice.ts';
// import { selectFilterSetWithResults } from '@/store/subscriptionDataSlice.ts';
// import { filterMatch } from '@/utils/primitive.ts';
//
// import type { PayloadAction } from '@reduxjs/toolkit';
//
// type State = {};
//
// const initialState: State = {
//   selectedBookIsbn: null,
// };
//
// export const bookDetailDrawerSlice = createSlice({
//   name: 'scannerPageDrawer',
//   initialState,
//   reducers: {
//     openDrawer: (state, action: PayloadAction<string>) => {
//       state.selectedBookIsbn = action.payload;
//     },
//     closeDrawer: (state) => {
//       state.selectedBookIsbn = null;
//     },
//   },
// });
//
// export const { openDrawer, closeDrawer } = bookDetailDrawerSlice.actions;
//
// export const selectSelectedBook = createSelector(
//   [selectFilterSetWithResults, selectFetchedBookList, selectSelectedBookIsbn],
//   (filterSetWithResults, fetchedBooks, isbn) => {
//     if (!isbn) return null;
//     if (!filterSetWithResults) return { status: 'loading' };
//
//     return dbBooks.find(filterMatch({ isbn })) ?? fetchedBooks.find(filterMatch({ isbn }))?.bookDetail?.book ?? null;
//   }
// );
//
// export default bookDetailDrawerSlice.reducer;
