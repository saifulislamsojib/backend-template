export type PersistenceErrorKind = "castError" | "validationError" | "duplicateEntry";

export default class PersistenceError extends Error {
  readonly kind: PersistenceErrorKind;

  constructor(kind: PersistenceErrorKind, message: string) {
    super(message);
    this.name = "PersistenceError";
    this.kind = kind;
  }
}
