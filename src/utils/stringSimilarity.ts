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

/** 文字列の類似度を返す (0 ~ 1.0) */
export const getStringSimilarity = (a: string, b: string) => {
  const aGram = getToNgram(a);
  const bGram = getToNgram(b);
  const keyOfAGram = Object.keys(aGram);
  const keyOfBGram = Object.keys(bGram);
  const abKey = keyOfAGram.filter(n => keyOfBGram.includes(n));
  const dot = abKey.reduce((prev, key) => prev + Math.min(aGram[key], bGram[key]), 0);
  const abLengthMul = Math.sqrt(getValuesSum(aGram) * getValuesSum(bGram));

  return dot / abLengthMul;
};
