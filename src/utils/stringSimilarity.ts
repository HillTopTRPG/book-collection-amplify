/**
 * デフォルトのN-gramサイズ
 */
const DEFAULT_NGRAM_SIZE = 3;

/**
 * N-gramキャッシュの最大サイズ（LRU）
 * ページ遷移を繰り返してもメモリリークを防ぐ
 */
const MAX_NGRAM_CACHE_SIZE = 1000;

type NgramFrequencyMap = { [key: string]: number };

// N-gram 頻度マップのキャッシュ（LRU方式）
const ngramCache = new Map<string, NgramFrequencyMap>();

/**
 * 文字列からN-gramの頻度マップを生成する（LRUメモ化版）
 */
const generateNgramFrequencyMap = (text: string, ngramSize: number = DEFAULT_NGRAM_SIZE): NgramFrequencyMap => {
  const cacheKey = `${text}:${ngramSize}`;

  if (ngramCache.has(cacheKey)) {
    // LRU: 既存のエントリを削除して最後に再追加（最近使用したものを末尾に移動）
    const cached = ngramCache.get(cacheKey)!;
    ngramCache.delete(cacheKey);
    ngramCache.set(cacheKey, cached);
    return cached;
  }

  const frequencyMap: NgramFrequencyMap = {};

  for (let gramLength = 1; gramLength <= ngramSize; gramLength++) {
    for (let startIndex = 0; startIndex <= text.length - gramLength; startIndex++) {
      const ngram = text.substring(startIndex, startIndex + gramLength);
      frequencyMap[ngram] = frequencyMap[ngram] ? frequencyMap[ngram] + 1 : 1;
    }
  }

  // キャッシュサイズが上限を超えたら最古のエントリを削除
  if (ngramCache.size >= MAX_NGRAM_CACHE_SIZE) {
    const firstKey = ngramCache.keys().next().value;
    ngramCache.delete(firstKey);
  }

  ngramCache.set(cacheKey, frequencyMap);
  return frequencyMap;
};

/**
 * N-gram頻度マップの値の合計を計算する
 */
const calculateFrequencySum = (frequencyMap: NgramFrequencyMap): number =>
  Object.values(frequencyMap).reduce((sum, frequency) => sum + frequency, 0);

/**
 * 2つのN-gram頻度マップから共通のN-gramキーを抽出する
 */
const extractCommonNgramKeys = (frequencyMap1: NgramFrequencyMap, frequencyMap2: NgramFrequencyMap): string[] => {
  const keys1 = Object.keys(frequencyMap1);
  const keys2 = Object.keys(frequencyMap2);

  return keys1.filter(key => keys2.includes(key));
};

/**
 * 共通のN-gramキーからドット積を計算する
 */
const calculateDotProduct = (
  commonKeys: string[],
  frequencyMap1: NgramFrequencyMap,
  frequencyMap2: NgramFrequencyMap
): number => commonKeys.reduce((dotProduct, key) => dotProduct + Math.min(frequencyMap1[key], frequencyMap2[key]), 0);

/**
 * 2つのN-gram頻度マップのベクトル長の積を計算する
 */
const calculateVectorLengthProduct = (frequencyMap1: NgramFrequencyMap, frequencyMap2: NgramFrequencyMap): number => {
  const sum1 = calculateFrequencySum(frequencyMap1);
  const sum2 = calculateFrequencySum(frequencyMap2);

  return Math.sqrt(sum1 * sum2);
};

/**
 * 2つの文字列の類似度を計算する（0～1.0の範囲）
 * N-gramベースのコサイン類似度を使用
 */
export const getStringSimilarity = (text1: string, text2: string): number => {
  const frequencyMap1 = generateNgramFrequencyMap(text1);
  const frequencyMap2 = generateNgramFrequencyMap(text2);

  const commonKeys = extractCommonNgramKeys(frequencyMap1, frequencyMap2);
  const dotProduct = calculateDotProduct(commonKeys, frequencyMap1, frequencyMap2);
  const vectorLengthProduct = calculateVectorLengthProduct(frequencyMap1, frequencyMap2);

  return dotProduct / vectorLengthProduct;
};

/**
 * N-gramキャッシュをクリアする（デバッグ・テスト用）
 */
export const clearNgramCache = (): void => {
  ngramCache.clear();
};

/**
 * N-gramキャッシュの現在のサイズを取得する（デバッグ用）
 */
export const getNgramCacheSize = (): number => ngramCache.size;
