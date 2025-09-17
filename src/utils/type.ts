import { keys } from 'es-toolkit/compat';

export const getKeys = <Obj extends Record<string | number | symbol, unknown>>(obj: Obj) => keys(obj) as (keyof Obj)[];
