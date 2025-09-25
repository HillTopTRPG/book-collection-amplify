import type { BookData } from '@/types/book.ts';
import { getVolumeNumber, isNearDateBook } from '@/utils/bookData.ts';
import { getStringSimilarity } from '@/utils/stringSimilarity.ts';
import { removeNumberText } from './primitive.ts';

type BookWithVolume = { book: BookData; volume: number };
export type BookGroup = BookWithVolume[];

interface MatchCandidate {
  bookWithVolume: BookWithVolume;
  groupIndex: number;
  itemIndex: number;
}

interface ScoredCandidate extends MatchCandidate {
  score: number;
}

const DEBUG_ISBN = ['9784086177849'];
const shouldLogDebugInfo = (bookWithVolume: BookWithVolume) => DEBUG_ISBN.includes(bookWithVolume.book.isbn);

/**
 * 書籍のプロパティ値を取得する
 */
const getBookProperty = <Property extends keyof BookData>(bookWithVolume: BookWithVolume, property: Property) =>
  bookWithVolume.book[property];

/**
 * 2つの書籍の指定プロパティが等しいかどうかを判定する
 */
const arePropertiesEqual = <Property extends keyof BookData>(
  book1: BookWithVolume,
  book2: BookWithVolume,
  property: Property,
  transformer?: (value: BookData[Property], volume: number) => string | null | undefined
): boolean => {
  const getValue = (bookWithVolume: BookWithVolume) => {
    const rawValue = getBookProperty(bookWithVolume, property);

    return transformer ? (transformer(rawValue, bookWithVolume.volume) ?? '') : rawValue;
  };

  const [value1, value2] = [book1, book2].map(getValue);

  return value1 === value2 && Boolean(value1) && Boolean(value2);
};

/**
 * 2つの書籍の指定プロパティの文字列類似度を計算する
 */
const calculateStringSimilarity = <Property extends keyof BookData>(
  book1: BookWithVolume,
  book2: BookWithVolume,
  property: Property
): number => {
  const [value1, value2] = [book1, book2].map(book => getBookProperty(book, property));

  return typeof value1 === 'string' && typeof value2 === 'string' ? getStringSimilarity(value1, value2) : 0;
};

/**
 * 文字列から巻数部分を除去してトリムする変換関数
 */
const createVolumeTransformer = (value: string | null | undefined, volume: number) =>
  value?.replace(volume.toString(), '').trim();

interface MatchingRule {
  name: string;
  calculateScore: (book1: BookWithVolume, book2: BookWithVolume) => number;
}

const MATCHING_RULES: MatchingRule[] = [
  {
    name: 'ISBN一致',
    calculateScore: (book1, book2) => (getBookProperty(book1, 'isbn') === getBookProperty(book2, 'isbn') ? 1000 : 0),
  },
  {
    name: 'タイトル一致',
    calculateScore: (book1, book2) => {
      if (arePropertiesEqual(book1, book2, 'title')) return 1;
      const similarity = calculateStringSimilarity(book1, book2, 'title');
      if (shouldLogDebugInfo(book2)) {
        console.log('calc:', similarity, book1.book.isbn);
      }
      return similarity >= 0.9 ? 1 : 0;
    },
  },
  {
    name: 'タイトル一致かつvolumeの一部が一致',
    calculateScore: (book1, book2) => {
      if (!arePropertiesEqual(book1, book2, 'title')) return 0;
      return arePropertiesEqual(book1, book2, 'volume', createVolumeTransformer) ? 1 : 0;
    },
  },
  {
    name: 'タイトル一致かつvolumeTitleの一部が一致',
    calculateScore: (book1, book2) => {
      if (!arePropertiesEqual(book1, book2, 'title')) return 0;
      return arePropertiesEqual(book1, book2, 'volumeTitle', createVolumeTransformer) ? 1 : 0;
    },
  },
  {
    name: 'タイトル一致かつextentの一部が一致',
    calculateScore: (book1, book2) => {
      if (!arePropertiesEqual(book1, book2, 'title')) return 0;

      const parseExtent = (bookWithVolume: BookWithVolume) => {
        const extent = getBookProperty(bookWithVolume, 'extent');
        if (!extent) return null;

        return extent
          .replace(/[0-9]+ *p/g, '')
          .split(';')
          .flatMap(part =>
            part
              .trim()
              .split(/[+＋×]/g)
              .map(subPart => {
                const trimmed = subPart.trim();
                const matchResult = trimmed.match(/([0-9]+) *(cm)/);

                return matchResult ? `${matchResult[1]}${matchResult[2]}` : trimmed;
              })
          )
          .filter(Boolean);
      };

      const [extentParts1, extentParts2] = [book1, book2].map(parseExtent);
      if (!extentParts1 || !extentParts2) return 0;

      return extentParts1.filter(part => extentParts2.includes(part)).length;
    },
  },
  {
    name: 'タイトル一致かつndcコード一致',
    calculateScore: (book1, book2) => {
      if (!arePropertiesEqual(book1, book2, 'title')) return 0;

      const getNdcCode = (bookWithVolume: BookWithVolume) =>
        getBookProperty(bookWithVolume, 'ndc')?.replace(/^ndc[0-9]+:/g, '');

      const [ndc1, ndc2] = [book1, book2].map(getNdcCode);

      return Boolean(ndc1) && Boolean(ndc2) && ndc1 === ndc2 ? 1 : 0;
    },
  },
  {
    name: 'volume一部一致',
    calculateScore: (book1, book2) => (arePropertiesEqual(book1, book2, 'volume', createVolumeTransformer) ? 1 : 0),
  },
  {
    name: 'volumeTitle一部一致',
    calculateScore: (book1, book2) =>
      arePropertiesEqual(book1, book2, 'volumeTitle', createVolumeTransformer) ? 1 : 0,
  },
  {
    name: 'edition一致',
    calculateScore: (book1, book2) => (arePropertiesEqual(book1, book2, 'edition') ? 1 : 0),
  },
  {
    name: 'edition違いの出版日が近い',
    calculateScore: (book1, book2) => {
      const [edition1, edition2] = [book1, book2].map(book => getBookProperty(book, 'edition') ?? null);
      if ((!edition1 && !edition2) || edition1 === edition2) return 0;
      return isNearDateBook(book1.book, book2.book) ? 1 : 0;
    },
  },
  {
    name: 'タイトル一致かつシリーズ名の部分一致の数',
    calculateScore: (book1, book2) => {
      if (!arePropertiesEqual(book1, book2, 'title')) return 0;

      const getSeriesTitles = (bookWithVolume: BookWithVolume) =>
        getBookProperty(bookWithVolume, 'seriesTitle')?.split(';').map(removeNumberText).filter(Boolean) ?? [];

      const [seriesTitles1, seriesTitles2] = [book1, book2].map(getSeriesTitles);

      return seriesTitles1.filter(title => seriesTitles2.includes(title)).length;
    },
  },
];

const calculateBookScore = (candidate: BookWithVolume, target: BookWithVolume): number =>
  MATCHING_RULES.map(({ name, calculateScore }) => {
    const score = calculateScore(candidate, target);
    if (score && shouldLogDebugInfo(target)) {
      console.log(target.book.isbn, `+${score}`, candidate.book.isbn, name);
    }
    return score;
  }).reduce((totalScore, ruleScore) => totalScore + ruleScore, 0);

const isValidCandidate = (
  candidate: BookWithVolume,
  target: BookWithVolume,
  groupIndex: number,
  groups: BookGroup[]
): boolean => {
  const lastVolumeInGroup = groups[groupIndex][groups[groupIndex].length - 1].volume;
  // if (shouldLogDebugInfo(target) && target.volume - 2 <= candidate.volume && candidate.volume <= target.volume + 1) {
  //   console.log(lastVolumeInGroup, groupIndex, candidate.volume, candidate.book.isbn, target.volume);
  // }

  if (candidate.volume === target.volume && lastVolumeInGroup === candidate.volume + 1) {
    return true;
  }

  if (candidate.volume !== lastVolumeInGroup) {
    return false;
  }

  if (candidate.volume === 1 && target.volume === -1) return true;
  if (candidate.volume === -1) return [2, 1].includes(target.volume);
  if (candidate.volume === target.volume) return true;
  return candidate.volume + 1 === target.volume;
};

const findBestMatchingCandidates = (target: BookWithVolume, groups: BookGroup[]): ScoredCandidate[] => {
  const allCandidates = groups.flatMap((group, groupIndex) =>
    group.map((bookWithVolume, itemIndex) => ({
      bookWithVolume,
      groupIndex,
      itemIndex,
    }))
  );

  const validCandidates = allCandidates
    .filter(({ bookWithVolume, groupIndex }) => isValidCandidate(bookWithVolume, target, groupIndex, groups))
    .map(candidate => ({
      ...candidate,
      score: calculateBookScore(candidate.bookWithVolume, target),
    }));

  const maxScore = Math.max(0, ...validCandidates.map(c => c.score));

  if (shouldLogDebugInfo(target)) {
    console.log(allCandidates.length, validCandidates.length, maxScore);
  }

  return validCandidates.filter(candidate => maxScore > 0 && candidate.score === maxScore);
};

const logBookPlacement = (bookWithVolume: BookWithVolume, label: string, groupIndex: number, score: number) => {
  if (!shouldLogDebugInfo(bookWithVolume)) return;

  console.log(
    label,
    groupIndex,
    bookWithVolume.book.isbn,
    score,
    `'${bookWithVolume.book.title}'`,
    `'${bookWithVolume.book.volume}'`,
    `'${bookWithVolume.book.volumeTitle}'`,
    bookWithVolume.volume
  );
};

const addBookToGroups = (bookWithVolume: BookWithVolume, groups: BookGroup[]): void => {
  const bestCandidates = findBestMatchingCandidates(bookWithVolume, groups);

  if (bestCandidates.length === 0) {
    if (bookWithVolume.volume === -1) {
      groups[0].push(bookWithVolume);
      logBookPlacement(bookWithVolume, 'マッチしない非グループ(0)', -1, 0);
    } else {
      groups.push([bookWithVolume]);
      logBookPlacement(bookWithVolume, 'マッチしないVolumed', -1, 0);
    }
    return;
  }

  const sortedCandidates = bestCandidates.sort((a, b) => {
    if (a.groupIndex !== b.groupIndex) return b.groupIndex - a.groupIndex;
    return b.itemIndex - a.itemIndex;
  });

  const nextVolumeCandidates = sortedCandidates.filter(
    ({ bookWithVolume: candidate }) => candidate.volume !== -1 && candidate.volume + 1 === bookWithVolume.volume
  );

  if (nextVolumeCandidates.length > 0) {
    const { groupIndex, score } = nextVolumeCandidates[0];
    groups[groupIndex].push(bookWithVolume);
    logBookPlacement(bookWithVolume, 'next', groupIndex, score);
    return;
  }

  const sameVolumeCandidates = sortedCandidates.filter(
    ({ bookWithVolume: candidate }) => candidate.volume === bookWithVolume.volume
  );

  if (sameVolumeCandidates.length > 0) {
    const { groupIndex, score, bookWithVolume: item } = sameVolumeCandidates[0];
    const itemList = groups[groupIndex];
    if (shouldLogDebugInfo(bookWithVolume)) {
      console.log(itemList[itemList.length - 1].volume, bookWithVolume.volume, item.volume);
    }
    if (itemList[itemList.length - 1].volume === bookWithVolume.volume) {
      itemList.push(bookWithVolume);
      logBookPlacement(bookWithVolume, 'equals(1)', groupIndex, score);
      return;
    } else {
      groups.push([bookWithVolume]);
      logBookPlacement(bookWithVolume, 'equals(2)', groupIndex, score);
      return;
    }
  }

  const unSeriesCandidates = sortedCandidates.filter(({ groupIndex }) => groupIndex === 0);

  if (unSeriesCandidates.length > 0) {
    const movedBooks: BookWithVolume[] = [];
    unSeriesCandidates.forEach(({ itemIndex }) => {
      movedBooks.push(...groups[0].splice(itemIndex, 1));
    });
    movedBooks.forEach(book => (book.volume = 1));
    movedBooks.push(bookWithVolume);
    groups.push(movedBooks);
    logBookPlacement(bookWithVolume, 'unSeries', -1, unSeriesCandidates[0].score);
    return;
  }

  const { groupIndex, score } = sortedCandidates[0];
  if (bookWithVolume.volume === -1) bookWithVolume.volume = 1;
  groups[groupIndex].push(bookWithVolume);
  logBookPlacement(bookWithVolume, 'else', groupIndex, score);
};

export const groupByVolume = (books: BookData[]): BookGroup[] => {
  const groups: BookGroup[] = [[]];

  books.forEach(book => {
    const volume = getVolumeNumber(book) ?? -1;
    const bookWithVolume: BookWithVolume = { book, volume };
    addBookToGroups(bookWithVolume, groups);
  });

  const unGroupedBooks = groups.shift();
  if (unGroupedBooks?.length) {
    groups.push(unGroupedBooks);
  }

  return groups;
};
