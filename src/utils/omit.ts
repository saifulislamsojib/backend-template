/**
 * Omits properties from an object. The type of the returned object is narrowed
 * to `Omit<T, K>`, where `T` is the type of the input object and `K` is the
 * union of all `keyof T` types in `props`.
 *
 * @example
 * const user = { name: "John", age: 30, email: "john@example.com" };
 * const userWithoutEmail = omit(user, "email");
 * // userWithoutEmail is of type { name: string, age: number }
 *
 * @param obj The object to omit properties from.
 * @param props The property names to omit.
 * @returns A new object with only the properties that were not in `props`.
 */
const omit = <T extends Record<string, unknown>, K extends keyof T>(obj: T, ...props: K[]) => {
  const newObj = { ...obj };
  props.forEach((prop) => delete newObj[prop]);
  return newObj as Omit<T, K>;
};

export default omit;
