import { convert } from '@/components/Drawer/BookDetailDrawer/FilterBlock/SearchConditionItem.tsx';
import type { BookData } from '@/types/book.ts';
import { getVolumeNumber, isNearDateBook } from '@/utils/bookData.ts';
import { getStringSimilarity } from '@/utils/stringSimilarity.ts';

const OUTPUT_ISBN = ['9784061996694'];
const isOutputInfo = ({ book }: GroupingInfo[number]) => OUTPUT_ISBN.includes(book.isbn);

const getBookValue = <Property extends keyof BookData>(v: GroupingInfo[number], property: Property) => v.book[property];

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

  return typeof c1 === 'string' && typeof c2 === 'string' ? getStringSimilarity(c1, c2) : 0;
};

const POINT_RULES: { rule: (v1: GroupingInfo[number], v2: GroupingInfo[number]) => number; message: string }[] = [
  { message: 'ISBN一致', rule: (v1, v2) => (getBookValue(v1, 'isbn') === getBookValue(v2, 'isbn') ? 1000 : 0) },
  {
    message: 'タイトル一致',
    rule: (v1, v2) => {
      if (simpleEquals(v1, v2, 'title')) return 1;
      const calc = calculateBookValues(v1, v2, 'title');
      if (isOutputInfo(v2)) console.log('calc:', calc, v1.book.isbn);
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
    rule: (v1, v2) => (simpleEquals(v1, v2, 'volume', (v, volume) => v?.replace(volume.toString(), '').trim()) ? 1 : 0),
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
      const [c1, c2] = [v1, v2].map(v => getBookValue(v, 'seriesTitle')?.split(';').map(convert).filter(Boolean) ?? []);

      return c1.filter(s => c2.includes(s)).length;
    },
  },
];

const pushInfoToResults = (info: GroupingInfo[number], results: GroupingInfo[]) => {
  const output = (label: string, groupIndex: number, point: number) => {
    if (!isOutputInfo(info)) return;
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
      point: POINT_RULES.map(({ rule, message }) => {
        const result = rule(data.item, info);
        if (result && isOutputInfo(info)) {
          console.log(info.book.isbn, `+${result}`, data.item.book.isbn, message);
        }
        return result;
      }).reduce((sum, point) => sum + point, 0),
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

export const groupByVolume = (books: BookData[]): GroupingInfo[] => {
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
