import { Error as MongooseError, mongo } from "mongoose";
import PersistenceError from "./PersistenceError";
import { translateDatabaseError } from "./mongooseErrors";

describe("persistence error translation", () => {
  it("translates a real ObjectId cast failure", () => {
    const translated = translateDatabaseError(
      new MongooseError.CastError("ObjectId", "invalid-id", "_id"),
    );
    expect(translated).toBeInstanceOf(PersistenceError);
    expect(translated).toMatchObject({
      kind: "castError",
      message: '"invalid-id" is not a valid ID!',
    });
  });

  it("combines all field validation failures in order", () => {
    const error = new MongooseError.ValidationError();
    error.addError(
      "name",
      new MongooseError.ValidatorError({ path: "name", message: "Name is required" }),
    );
    error.addError(
      "email",
      new MongooseError.ValidatorError({ path: "email", message: "Email is invalid" }),
    );
    const translated = translateDatabaseError(error);
    expect(translated).toBeInstanceOf(PersistenceError);
    expect(translated).toMatchObject({
      kind: "validationError",
      message: "Name is required.; Email is invalid.",
    });
  });

  it.each([
    {
      label: "keyPattern precedence",
      metadata: { keyPattern: { email: 1 }, keyValue: { privateField: "secret@example.com" } },
      message: "A record with this email already exists",
    },
    {
      label: "compound index",
      metadata: { keyPattern: { email: 1, tenant: 1 } },
      message: "A record with this email and tenant already exists",
    },
    {
      label: "keyValue only",
      metadata: { keyValue: { email: "secret@example.com" } },
      message: "A record with this email already exists",
    },
    {
      label: "empty pattern",
      metadata: { keyPattern: {}, keyValue: { email: "secret@example.com" } },
      message: "A record with this email already exists",
    },
    { label: "missing metadata", metadata: {}, message: "A record already exists" },
    {
      label: "empty metadata",
      metadata: { keyPattern: {}, keyValue: {} },
      message: "A record already exists",
    },
    {
      label: "malformed metadata",
      metadata: { keyPattern: ["email"], keyValue: "secret@example.com" },
      message: "A record already exists",
    },
  ])("translates duplicate keys with $label without disclosing values", ({ metadata, message }) => {
    const error = new mongo.MongoServerError({
      message: 'E11000 duplicate key: { email: "secret@example.com" }',
      code: 11000,
      ...metadata,
    });
    const translated = translateDatabaseError(error);
    expect(translated).toBeInstanceOf(PersistenceError);
    expect(translated).toMatchObject({ kind: "duplicateEntry", message });
    expect(translated).not.toHaveProperty("keyValue");
  });

  it.each([
    new mongo.MongoServerError({ message: "not primary", code: 10107 }),
    Object.assign(new Error("not a duplicate"), { code: "11000" }),
    Object.assign(new Error("unrelated cast failure"), { name: "CastError" }),
    new PersistenceError("duplicateEntry", "A record already exists"),
    null,
    "unexpected rejection",
  ])("preserves unrecognized or already translated failures (%s)", (error) => {
    expect(translateDatabaseError(error)).toBe(error);
  });

  it("preserves unexpected database failures instead of turning them into client errors", () => {
    const error = new Error("database unavailable");
    expect(translateDatabaseError(error)).toBe(error);
  });
});
