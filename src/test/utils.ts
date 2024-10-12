export const types = {
  string: expect.any(String) as string,
  number: expect.any(Number) as number,
  boolean: expect.any(Boolean) as boolean,
  array: expect.any(Array) as unknown[],
  object: expect.any(Object) as object,
  date: expect.any(Date) as Date,
};

/**
 * Helper function to generate a vitest matcher for a given enum array.
 * This can be used to check if a string value is one of the enum values.
 * @example
 * const myEnum = ['a', 'b', 'c'] as const;
 * expect('a').toEqual(expectEnum(myEnum));
 */
export const expectEnum = <const T>(enumArr: readonly T[]) =>
  expect.stringMatching(enumArr.join('|')) as string;
