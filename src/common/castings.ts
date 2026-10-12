import { Varchar } from '@prisma/orm-postgres/target/codec-types';

export function toVarchar<N extends number>(value: string, max: N): Varchar<N> {
  if (value.length > max && [...value].length > max) {
    throw new RangeError(`Value exceeds varchar(${max})`);
  }
  return value as Varchar<N>;
}