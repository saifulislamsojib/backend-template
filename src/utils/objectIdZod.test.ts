import { Types } from "mongoose";
import { objectIdZod } from "./objectIdZod";

describe("objectIdZod", () => {
  it("accepts MongoDB ObjectId strings", () => {
    expect(objectIdZod.parse(new Types.ObjectId().toHexString())).toMatch(/^[a-f\d]{24}$/i);
  });

  it("accepts uppercase hexadecimal IDs without changing their value", () => {
    const id = "ABCDEF0123456789ABCDEF01";
    expect(objectIdZod.parse(id)).toBe(id);
  });

  it.each([
    "not-an-id",
    "a".repeat(23),
    "a".repeat(25),
    "g".repeat(24),
    "abcdefghijkl",
    " abcdef0123456789abcdef01",
    new Types.ObjectId(),
    123,
    null,
  ])("rejects invalid ID input (%s)", (value) => {
    expect(objectIdZod.safeParse(value).success).toBe(false);
  });
});
