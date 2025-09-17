export const checkIsdnCode = (code: string | null) => {
  if (!code || ![10, 13].some(v => v === code.length)) return false;

  const checkDigit = code.slice(-1); // バーコードからチェックディジットを抽出する
  const barcodeDigits = code.slice(0, -1).split(''); // チェックディジットを除いたバーコードの桁を抽出する

  if (code.length === 13) {
    let sum = 0;
    for (let i = 0; i < barcodeDigits.length; i++) {
      if (i % 2 === 0) {
        sum += parseInt(barcodeDigits[i]); // 奇数桁を足す
      } else {
        sum += 3 * parseInt(barcodeDigits[i]); // 偶数桁を3倍する
      }
    }

    return (sum + parseInt(checkDigit)) % 10 === 0;
  }

  let sum = 0;
  for (let i = 0; i < barcodeDigits.length; i++) {
    sum += parseInt(barcodeDigits[i]) * (10 - i);
  }

  return (sum + parseInt(checkDigit === 'X' ? '10' : checkDigit)) % 11 === 0;
};
