import omit from './omit';

describe('omit', () => {
  it('returns a new object without the omitted property', () => {
    const user = { name: 'John', age: 30, email: 'john@example.com' };

    expect(omit(user, 'email')).toStrictEqual({ name: 'John', age: 30 });
  });

  it('omits multiple properties', () => {
    const user = { name: 'John', age: 30, email: 'john@example.com' };

    expect(omit(user, 'name', 'age')).toStrictEqual({ email: 'john@example.com' });
  });

  it('does not mutate the original object', () => {
    const user = { name: 'John', age: 30 };

    const result = omit(user, 'age');

    expect(user).toStrictEqual({ name: 'John', age: 30 });
    expect(result).not.toBe(user);
  });
});
