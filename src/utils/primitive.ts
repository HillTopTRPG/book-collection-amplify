import { getKeys } from '@/utils/type.ts';

export const removeNumberText = (v: string | null | undefined) =>
  v
    ?.trim()
    .replace(/^[0-9()[\]a-zA-Z-.]+$/, '')
    .replace(/^[0-9[(. ]+/, '')
    .replace(/[0-9.)\] ]+$/, '')
    .trim() ?? '';

export const unique = <T>(list: T[]) => list.filter((v, i, s) => s.findIndex(a => a === v) === i);

export const filterMatch =
  <Conditions extends Record<string, unknown>>(conditions: Conditions): ((obj: Conditions) => boolean) =>
  obj =>
    getKeys(conditions).some(key => conditions[key] === obj[key]);

export const wait = async (ms: number): Promise<void> => void (await new Promise(resolve => setTimeout(resolve, ms)));

export const deleteAllStrings = <T extends string>(list: T[], values: T[]) => {
  list
    .flatMap((v, index) => (values.includes(v) ? [index] : []))
    .reverse()
    .forEach(deleteIndex => list.splice(deleteIndex, 1));
};

export const entries = <T extends string, U>(map: Map<T, U>): Record<T, U> => Object.fromEntries(map) as Record<T, U>;

export const recordAt = <T extends string, U>(record: Record<T, U>, key: T): U | undefined =>
  key in record ? record[key] : undefined;
