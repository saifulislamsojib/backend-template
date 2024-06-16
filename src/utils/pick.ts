const pick = <T extends Record<string, unknown>, K extends keyof T>(obj: T, ...props: K[]) => {
  return props.reduce(
    (acc, prop) => {
      if (prop in obj) {
        acc[prop] = obj[prop];
      }
      return acc;
    },
    {} as Record<K, T[K]>,
  );
};

export default pick;
