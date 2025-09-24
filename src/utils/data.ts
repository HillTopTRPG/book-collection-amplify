import { isNil } from 'es-toolkit/compat';
import { convert } from '@/components/Drawer/BookDetailDrawer/FilterBlock/SearchConditionItem.tsx';
import type { NdlFullOptions } from '@/components/Drawer/BookDetailDrawer/FilterSets/NdlOptionsForm.tsx';
import type { ScannedItemMapValue } from '@/store/scannerSlice.ts';
import type { Collection, FilterBean, FilterSet } from '@/store/subscriptionDataSlice.ts';
import type { BookData } from '@/types/book.ts';
import type { NdlFetchOptions } from '@/types/fetch.ts';
import { filterMatch } from '@/utils/primitive.ts';
import type { PickRequired } from '@/utils/type.ts';
import { getKeys } from '@/utils/type.ts';

export const getScannedItemMapValueByBookData = (collections: Collection[], book: BookData): ScannedItemMapValue => {
  const isbn = book.isbn;
  const result: PickRequired<ScannedItemMapValue, 'bookDetail'> = {
    isbn,
    status: 'loading',
    collectionId: null,
    bookDetail: { book, isHave: false, isWant: false },
    filterSets: [],
  };
  const collection = collections.find(filterMatch({ isbn }));
  if (collection) {
    result.bookDetail.book = { ...book, ...collection.meta.overwrite };
    result.bookDetail.isHave = collection.meta.isHave ?? false;
    result.bookDetail.isWant = collection.meta.isWant ?? false;
  }
  return result;
};

export const makeNdlOptionsStringByNdlFullOptions = (ndlFullOptions: NdlFullOptions): string => {
  const requestOptions: NdlFetchOptions = {
    title: ndlFullOptions.title,
    creator: ndlFullOptions.useCreator ? ndlFullOptions.creator : undefined,
    publisher: ndlFullOptions.usePublisher ? ndlFullOptions.publisher : undefined,
  };

  return JSON.stringify(requestOptions);
};

export const deleteAllStrings = <T extends string>(list: T[], values: T[]) => {
  list
    .flatMap((v, index) => (values.includes(v) ? [index] : []))
    .reverse()
    .forEach(deleteIndex => list.splice(deleteIndex, 1));
};

const isMatch = (filter: FilterBean, list: string[]) => {
  const keyword = filter.keyword;
  switch (filter.sign) {
    case '==':
      return list.includes(keyword);
    case '*=':
      return list.some(v => v.includes(keyword));
    case '!=':
      return list.every(v => v !== keyword);
    case '!*':
      return list.every(v => !v.includes(keyword));
  }
};

export const entries = <T extends string, U>(map: Map<T, U>): Record<T, U> => Object.fromEntries(map) as Record<T, U>;

export const getFilteredItems = (fetchedBooks: BookData[], filterSet: FilterSet, filterIndex: number): BookData[] => {
  if (!fetchedBooks?.length) return [];

  const filters = filterSet.filters[filterIndex].list.filter(({ keyword }) => keyword);
  if (!filters.length) return !filterIndex ? fetchedBooks : [];

  return fetchedBooks.filter(book =>
    filters.every(filter =>
      isMatch(
        filter,
        getKeys(book).flatMap(property => {
          const value = book[property];
          if (isNil(value)) return [];
          if (typeof value === 'string') return [value];
          return value;
        })
      )
    )
  );
};

const getToNgram = (text: string, n: number = 3) => {
  const ret: { [key: string]: number } = {};
  for (let m = 0; m < n; m++) {
    for (let i = 0; i < text.length - m; i++) {
      const c = text.substring(i, i + m + 1);
      ret[c] = ret[c] ? ret[c] + 1 : 1;
    }
  }
  return ret;
};

const getValuesSum = (object: { [key: string]: number }) =>
  Object.values(object).reduce((prev, current) => prev + current, 0);

const calculate = (a: string, b: string) => {
  const aGram = getToNgram(a);
  const bGram = getToNgram(b);
  const keyOfAGram = Object.keys(aGram);
  const keyOfBGram = Object.keys(bGram);
  const abKey = keyOfAGram.filter(n => keyOfBGram.includes(n));
  const dot = abKey.reduce((prev, key) => prev + Math.min(aGram[key], bGram[key]), 0);
  const abLengthMul = Math.sqrt(getValuesSum(aGram) * getValuesSum(bGram));

  return dot / abLengthMul;
};

const getVolumeNumber = (book: BookData): number | null => {
  const str = (book.volume || book.volumeTitle || book.title || '')
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replaceAll(/[[\]()]/g, '')
    .trim();
  const maybeNumStr = [str.match(/^[0-9]+$/)?.at(0), str.match(/[0-9]+$/)?.at(0)].find(s => s !== undefined);
  if (maybeNumStr === undefined) return null;
  return parseInt(maybeNumStr, 10);
};

const isNearDateBook = (b1: BookData, b2: BookData): boolean => {
  const r1 = b1.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  const r2 = b2.date?.match(/([0-9]{4})\.([0-9]{1,2})\.?([0-9]{1,2})?/)?.slice(1);
  if (!r1 || !r2) return false;
  const d1 = new Date(parseInt(r1[0]), parseInt(r1[1]) - 1, r1[2] ? parseInt(r1[2]) : 15);
  const d2 = new Date(parseInt(r2[0]), parseInt(r2[1]) - 1, r2[2] ? parseInt(r2[2]) : 15);
  const dayDiff = Math.abs((d2.getTime() - d1.getTime()) / 86400000);

  return dayDiff < 50;
};

const pushInfoToResults = (info: GroupingInfo[number], results: GroupingInfo[]) => {
  // if (info.volume === -1) {
  //   results[0].push(info);
  //   console.log(-1);
  //   return;
  // }
  const outputTargetIsbns = ['9784061996694'];
  const output = (label: string, groupIndex: number, point: number) => {
    if (!outputTargetIsbns.includes(info.book.isbn)) return;
    console.log(
      label,
      groupIndex,
      info.book.isbn,
      point,
      `'${info.book.title}'`,
      `'${info.book.volume}'`,
      `'${info.book.volumeTitle}'`,
      info.volume
    );
  };
  const getBookValue = <Property extends keyof BookData>(v: GroupingInfo[number], property: Property) =>
    v.book[property];
  const simpleEquals = <Property extends keyof BookData>(
    v1: GroupingInfo[number],
    v2: GroupingInfo[number],
    property: Property,
    convert?: (value: BookData[Property], volume: number) => string | null | undefined
  ): boolean => {
    const [c1, c2] = [v1, v2].map(v =>
      convert ? (convert(getBookValue(v, property), v.volume) ?? '') : getBookValue(v, property)
    );

    return c1 === c2 && Boolean(c1) && Boolean(c2);
  };
  const calculateBookValues = <Property extends keyof BookData>(
    v1: GroupingInfo[number],
    v2: GroupingInfo[number],
    property: Property
  ) => {
    const [c1, c2] = [v1, v2].map(v => getBookValue(v, property));

    return typeof c1 === 'string' && typeof c2 === 'string' ? calculate(c1, c2) : 0;
  };

  const pointRules: { rule: (v1: GroupingInfo[number], v2: GroupingInfo[number]) => number; message: string }[] = [
    { message: 'ISBN一致', rule: (v1, v2) => (getBookValue(v1, 'isbn') === getBookValue(v2, 'isbn') ? 1000 : 0) },
    {
      message: 'タイトル一致',
      rule: (v1, v2) => {
        if (simpleEquals(v1, v2, 'title')) return 1;
        const calc = calculateBookValues(v1, v2, 'title');
        if (outputTargetIsbns.includes(info.book.isbn)) console.log('calc:', calc, v1.book.isbn);
        return calc >= 0.9 ? 1 : -1;
      },
    },
    {
      message: 'タイトル一致かつvolumeの一部が一致',
      rule: (v1, v2) => {
        if (!simpleEquals(v1, v2, 'title')) return 0;
        const [c1, c2] = [v1, v2].map(v => getBookValue(v, 'volume')?.replace(v.volume.toString(), '').trim());
        if (!c1 || !c2) return 0;
        return c1 === c2 ? 1 : 0;
      },
    },
    {
      message: 'タイトル一致かつvolumeTitleの一部が一致',
      rule: (v1, v2) => {
        if (!simpleEquals(v1, v2, 'title')) return 0;
        const [c1, c2] = [v1, v2].map(v => getBookValue(v, 'volumeTitle')?.replace(v.volume.toString(), '').trim());
        if (!c1 || !c2) return 0;
        return c1 === c2 ? 1 : 0;
      },
    },
    {
      message: 'タイトル一致かつextentの一部が一致',
      rule: (v1, v2) => {
        if (!simpleEquals(v1, v2, 'title')) return 0;
        const [c1, c2] = [v1, v2].map(
          v =>
            getBookValue(v, 'extent')
              // ページ数は含めない
              ?.replace(/[0-9]+ *p/g, '')
              .split(';')
              // +や×は区切って考慮する
              .flatMap(v =>
                v
                  .trim()
                  .split(/[+＋×]/g)
                  .map(v => {
                    const str = v.trim();
                    const matchResult = str.match(/([0-9]+) *(cm)/g);
                    if (matchResult) return `${matchResult[1]}${matchResult[2]}`;
                    return str;
                  })
              )
              .filter(Boolean) ?? null
        );
        if (!c1 || !c2) return 0;
        return c1.filter(s => c2.includes(s)).length;
      },
    },
    {
      message: 'タイトル一致かつndcコード一致',
      rule: (v1, v2) => {
        if (!simpleEquals(v1, v2, 'title')) return 0;
        const [ndc1, ndc2] = [v1, v2].map(v => getBookValue(v, 'ndc')?.replace(/^ndc[0-9]+:/g, ''));

        return Boolean(ndc1) && Boolean(ndc2) && ndc1 === ndc2 ? 1 : 0;
      },
    },
    {
      message: 'volume一部一致',
      rule: (v1, v2) =>
        simpleEquals(v1, v2, 'volume', (v, volume) => v?.replace(volume.toString(), '').trim()) ? 1 : 0,
    },
    {
      message: 'volumeTitle一部一致',
      rule: (v1, v2) =>
        simpleEquals(v1, v2, 'volumeTitle', (v, volume) => v?.replace(volume.toString(), '').trim()) ? 1 : 0,
    },
    { message: 'edition一致', rule: (v1, v2) => (simpleEquals(v1, v2, 'edition') ? 1 : 0) },
    // (v1, v2) => simpleEquals(v1, v2, 'publisher'),
    {
      message: 'edition違いの出版日が近い',
      rule: (v1, v2) => {
        const [c1, c2] = [v1, v2].map(v => getBookValue(v, 'edition') ?? null);
        if ((!c1 && !c2) || c1 === c2) return 0;
        return isNearDateBook(v1.book, v2.book) ? 1 : 0;
      },
    },
    {
      message: 'タイトル一致かつシリーズ名の部分一致の数',
      rule: (v1, v2) => {
        if (!simpleEquals(v1, v2, 'title')) return 0;
        const [c1, c2] = [v1, v2].map(
          v => getBookValue(v, 'seriesTitle')?.split(';').map(convert).filter(Boolean) ?? []
        );

        return c1.filter(s => c2.includes(s)).length;
      },
    },
  ];
  const pointObj = results
    // 各階層のindexを付与した情報の一覧を生成
    .flatMap((group, groupIndex) =>
      group.map((item, itemIndex) => ({
        item,
        groupIndex,
        itemIndex,
      }))
    )
    // ポイントを算出する要素を限定する
    .filter(({ item, groupIndex }) => {
      const lastVolume = results[groupIndex][results[groupIndex].length - 1].volume;

      // 特別対応
      if (item.volume === info.volume && lastVolume === item.volume + 1) return true;

      // グループの最後のVolume番号と一致するものしか対象にしない
      if (item.volume !== lastVolume) return false;

      if (item.volume === 1 && info.volume === -1) return true;
      if (item.volume === -1) return [2, 1].includes(info.volume);
      if (item.volume === info.volume) return true;
      return item.volume + 1 === info.volume;
    })
    // ポイントを算出してリストに含める
    .map(data => ({
      ...data,
      point: pointRules
        .map(({ rule, message }) => {
          const result = rule(data.item, info);
          if (result && outputTargetIsbns.includes(info.book.isbn)) {
            console.log(info.book.isbn, `+${result}`, data.item.book.isbn, message);
          }
          return result;
        })
        .reduce((sum, point) => sum + point, 0),
    }))
    // 一覧の中で最も高いポイントを取った書籍情報の一覧を生成
    .reduce<{
      max: number;
      list: { item: GroupingInfo[number]; groupIndex: number; itemIndex: number; point: number }[];
    }>(
      (res, cur) => {
        if (res.max < cur.point) return { max: cur.point, list: [cur] };
        if (res.max > cur.point) return res;
        res.list.push(cur);
        return res;
      },
      { max: 0, list: [] }
    );
  if (!pointObj.max) {
    if (info.volume === -1) {
      results[0].push(info);
      output('マッチしない非グループ(0)', -1, 0);
    } else {
      results.push([info]);
      output('マッチしないVolumed(0)', -1, 0);
    }
    return;
  }

  // 付与されているindex情報に基づいてソート
  const list = pointObj.list.sort((a, b) => {
    if (a.groupIndex < b.groupIndex) return 1;
    if (a.groupIndex > b.groupIndex) return -1;
    if (a.itemIndex < b.itemIndex) return 1;
    if (a.itemIndex > b.itemIndex) return -1;
    return 0;
  });

  if (!list.length) {
    if (info.volume === -1) {
      results[0].push(info);
      output('マッチしない非グループ(1)', -1, 0);
    } else {
      results.push([info]);
      output('マッチしないVolumed(1)', -1, 0);
    }
    return;
  }

  const nextList = list.filter(({ item }) => item.volume !== -1 && item.volume + 1 === info.volume);
  if (nextList.length) {
    const { groupIndex, point } = nextList[0];
    results[groupIndex].push(info);
    output('next', groupIndex, point);
    return;
  }

  const equalsList = list.filter(({ item }) => item.volume === info.volume);
  if (equalsList.length) {
    const { groupIndex, point } = equalsList[0];
    results[groupIndex].push(info);
    output('equals', groupIndex, point);
    return;
  }

  const unSeriesList = list.filter(({ groupIndex }) => !groupIndex);
  if (unSeriesList.length) {
    const addList: GroupingInfo = [];
    unSeriesList.forEach(({ itemIndex }) => {
      addList.push(...results[0].splice(itemIndex, 1));
    });
    addList.forEach(item => (item.volume = 1));
    addList.push(info);
    results.push(addList);
    output('unSeries', -1, unSeriesList[0].point);
    return;
  }

  const { groupIndex, point } = list[0];
  info.volume = info.volume === -1 ? 1 : info.volume;
  results[groupIndex].push(info);
  output('else', groupIndex, point);
};

type GroupingInfo = { book: BookData; volume: number }[];
export const grouping = (books: BookData[]): GroupingInfo[] => {
  const results: GroupingInfo[] = [[]];
  books.forEach(book => {
    const volume = getVolumeNumber(book) ?? -1;
    pushInfoToResults({ book, volume }, results);
  });
  const unGroupList = results.shift();
  if (unGroupList?.length) results.push(unGroupList);
  // console.log(JSON.stringify(results, null, 2));
  return results;
};

export const isBookData = (book: BookData | string | null): book is BookData => {
  if (book === null) return false;
  return typeof book !== 'string';
};

export class XmlProcessor<T extends Record<string, string>> {
  constructor(
    private readonly parentElm: Element,
    private readonly queryMap: T
  ) {
    this.parentElm = parentElm;
    this.queryMap = queryMap;
  }

  public getContents(query: keyof T) {
    return this.parentElm?.querySelector(this.queryMap[query])?.textContent?.trim() ?? null;
  }

  public getAllContents(query: keyof T) {
    return Array.from(this.parentElm?.querySelectorAll(this.queryMap[query]) ?? []).flatMap(elm =>
      elm?.textContent ? [elm?.textContent] : []
    );
  }

  public getContentsByAttribute(query: keyof T, attribute: keyof T, match: keyof T) {
    return Array.from(this.parentElm?.querySelectorAll(this.queryMap[query]) ?? []).find(
      elm => elm.getAttribute(this.queryMap[attribute]) === this.queryMap[match]
    )?.textContent;
  }

  public getAllAttributes(query: keyof T, attribute: keyof T) {
    return Array.from(this.parentElm?.querySelectorAll(this.queryMap[query]) ?? []).flatMap(elm => {
      const attr = elm.getAttribute(this.queryMap[attribute]);

      return attr ? [attr] : [];
    });
  }
}
