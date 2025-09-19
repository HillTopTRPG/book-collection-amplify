import { keys } from 'es-toolkit/compat';

export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type PickRequired<T, K extends keyof T> = T & RequiredNotNull<Pick<T, K>>;

export const getKeys = <Obj extends Record<string | number | symbol, unknown>>(obj: Obj) => keys(obj) as (keyof Obj)[];
