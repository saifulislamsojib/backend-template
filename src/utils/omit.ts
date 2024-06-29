const omit = <T extends Record<string, unknown>, K extends keyof T>(obj: T, ...props: K[]) => {
  const newObj = { ...obj };
  props.forEach((prop) => delete newObj[prop]);
  return newObj as Omit<T, K>;
};

export default omit;
