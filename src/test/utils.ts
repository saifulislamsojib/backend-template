export const types = {
  string: expect.any(String),
  number: expect.any(Number),
  boolean: expect.any(Boolean),
  array: expect.any(Array),
  object: expect.any(Object),
  date: expect.any(Date),
};

/**
 * Helper function to generate a vitest matcher for a given enum array.
 * This can be used to check if a string value is one of the enum values.
 * @example
 * const myEnum = ['a', 'b', 'c'] as const;
 * expect('a').toEqual(expectEnum(myEnum));
 */
export const expectEnum = <const T>(enumArr: readonly T[]) =>
  expect.stringMatching(enumArr.join('|'));
