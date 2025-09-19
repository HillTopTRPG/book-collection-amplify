import { keys } from 'es-toolkit/compat';

export const sortString = (a: string | null | undefined, b: string | null | undefined, sortOrder: 'asc' | 'desc') => {
  if (a === b) return 0;
  return ((a ?? '') > (b ?? '') ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1);
};

export const convertPubdate = (pubdate: string | null | undefined) => {
  if (!pubdate) return '';
  pubdate = pubdate
    .replace('年', '-')
    .replace('月', '-')
    .replace(/[日頃初中下旬]/g, '');
  return new Date(pubdate).toLocaleDateString('sv-SE');
};

export const filterMatch =
  <Conditions extends Record<string, unknown>>(conditions: Conditions): ((obj: Conditions) => boolean) =>
  obj =>
    keys(conditions).some(key => conditions[key] === obj[key]);

type PickSameProperties<T1, T2> = Pick<
  T1,
  {
    [K in keyof T1 & keyof T2]: T1[K] extends T2[K] ? (T1[K] extends T2[K] ? K : never) : never;
  }[keyof T1 & keyof T2]
>;

export const filterArrayByKey = <Array1 extends Record<string, unknown>[]>(
  array1: Array1,
  array2: Record<string, unknown>[],
  property: keyof PickSameProperties<Array1[number], (typeof array2)[number]>
): Array1 => array1.filter(item1 => array2.some(item2 => item1[property] === item2[property])) as Array1;
export const excludeArrayByKey = <Array1 extends Record<string, unknown>[]>(
  array1: Array1,
  array2: Record<string, unknown>[],
  property: keyof PickSameProperties<Array1[number], (typeof array2)[number]>
): Array1 => array1.filter(item1 => !array2.some(item2 => item1[property] === item2[property])) as Array1;

export const wait = async (ms: number): Promise<void> => void (await new Promise(resolve => setTimeout(resolve, ms)));
