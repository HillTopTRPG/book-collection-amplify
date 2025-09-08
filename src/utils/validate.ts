export function checkIsdnCode(code: string | null) {
  if (code?.length !== 13) return false;
  if (!(code.startsWith('978') || code.startsWith('979'))) return false;

  const checkDigit = parseInt(code.slice(-1)); // バーコードからチェックディジットを抽出する
  const barcodeDigits = code.slice(0, -1).split(''); // チェックディジットを除いたバーコードの桁を抽出する

  let sum = 0;
  for (let i = 0; i < barcodeDigits.length; i++) {
    if (i % 2 === 0) {
      sum += parseInt(barcodeDigits[i]); // 奇数桁を足す
    } else {
      sum += 3 * parseInt(barcodeDigits[i]); // 偶数桁を3倍する
    }
  }

  return (sum + checkDigit) % 10 === 0;
}
