export const types = {
  string: expect.any(String),
  number: expect.any(Number),
  boolean: expect.any(Boolean),
  array: expect.any(Array),
  object: expect.any(Object),
  date: expect.any(Date),
};

export const expectEnum = <const T>(enumArr: readonly T[]) =>
  expect.stringMatching(enumArr.join('|'));
