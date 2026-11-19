import PersistenceError, { type PersistenceErrorKind } from "./PersistenceError";

describe("PersistenceError", () => {
  it.each<PersistenceErrorKind>(["castError", "validationError", "duplicateEntry"])(
    "retains the Error contract and %s classification",
    (kind) => {
      const error = new PersistenceError(kind, "A client-safe persistence message");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PersistenceError);
      expect(error.name).toBe("PersistenceError");
      expect(error.message).toBe("A client-safe persistence message");
      expect(error.kind).toBe(kind);
      expect(error.toString()).toBe("PersistenceError: A client-safe persistence message");
    },
  );
});
