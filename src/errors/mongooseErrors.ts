import { Error as MongooseError } from "mongoose";
import PersistenceError from "./PersistenceError";

export const translateDatabaseError = (error: unknown): unknown => {
  if (error instanceof MongooseError.CastError) {
    return new PersistenceError("castError", `${error.stringValue} is not a valid ID!`);
  }
  if (error instanceof MongooseError.ValidationError) {
    return new PersistenceError(
      "validationError",
      Object.values(error.errors)
        .map(({ message }) => `${message}.`)
        .join("; "),
    );
  }
  if (error instanceof Error && "code" in error && error.code === 11000) {
    const metadata = error as Error & { keyPattern?: unknown; keyValue?: unknown };
    const keys = (value: unknown) =>
      value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];
    let fields = keys(metadata.keyPattern);
    if (!fields.length) fields = keys(metadata.keyValue);
    return new PersistenceError(
      "duplicateEntry",
      fields.length
        ? `A record with this ${fields.join(" and ")} already exists`
        : "A record already exists",
    );
  }
  return error;
};
