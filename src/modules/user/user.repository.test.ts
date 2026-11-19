import { Error as MongooseError, Types } from "mongoose";
import User from "./user.model";
import repository from "./user.repository";

describe("user repository", () => {
  beforeAll(async () => {
    await User.init();
  });

  const input = (email: string) => ({
    name: "  Jane Doe  ",
    email,
    password: "already-hashed",
  });

  it("returns plain allowlisted users with ObjectIds, Date timestamps, normalization and defaults", async () => {
    const user = await repository.createUser(input("  PROJECTION@example.com  "));
    expect(Object.getPrototypeOf(user)).toBe(Object.prototype);
    expect(user).toStrictEqual({
      _id: expect.any(Types.ObjectId) as ObjectId,
      name: "Jane Doe",
      email: "projection@example.com",
      role: "user",
      createdAt: expect.any(Date) as Date,
      updatedAt: expect.any(Date) as Date,
    });
    expect(await repository.existsByEmail(" PROJECTION@example.com ")).toBe(true);
    expect(await repository.findCredentialsByEmail(" PROJECTION@example.com ")).toStrictEqual({
      user,
      passwordHash: "already-hashed",
    });
    expect(await repository.findCredentialsById(user._id)).toStrictEqual({
      user,
      passwordHash: "already-hashed",
    });
    expect(await repository.findAuthStateById(user._id)).toStrictEqual(user);
    expect(await repository.findAuthStateById(user._id.toHexString())).toStrictEqual(user);
    expect(await repository.findCredentialsById(user._id.toHexString())).toStrictEqual({
      user,
      passwordHash: "already-hashed",
    });
  });

  it("returns null for missing rows and raw database errors for invalid IDs and invalid writes", async () => {
    const missing = "507f1f77bcf86cd799439011";
    expect(await repository.findCredentialsById(missing)).toBeNull();
    expect(await repository.findAuthStateById(missing)).toBeNull();
    expect(await repository.findCredentialsByEmail("missing@example.com")).toBeNull();
    expect(await repository.existsByEmail("missing@example.com")).toBe(false);
    await expect(repository.findCredentialsById("invalid")).rejects.toBeInstanceOf(
      MongooseError.CastError,
    );
    await expect(
      repository.createUser({ ...input("invalid@example.com"), name: "" }),
    ).rejects.toBeInstanceOf(MongooseError.ValidationError);
  });

  it("propagates a raw duplicate-key error for an index race after successful prechecks", async () => {
    const email = "race@example.com";
    expect(await repository.existsByEmail(email)).toBe(false);
    const results = await Promise.allSettled([
      repository.createUser(input(email)),
      repository.createUser(input(email)),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.reason).toMatchObject({
      code: 11000,
      keyPattern: { email: 1 },
    });
  });

  it("allows exactly one competing password update and returns the updated safe user", async () => {
    const user = await repository.createUser(input("password-race@example.com"));
    const updateStartedAt = Date.now();
    const results = await Promise.all([
      repository.updatePasswordIfCurrent(user._id, "already-hashed", "hash-a"),
      repository.updatePasswordIfCurrent(user._id.toHexString(), "already-hashed", "hash-b"),
    ]);
    const updateFinishedAt = Date.now();
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);
    const winner = results.find((result) => result !== null)!;
    expect(Object.keys(winner).sort()).toStrictEqual(Object.keys(user).sort());
    expect(winner.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
    expect(await repository.findCredentialsById(user._id)).toStrictEqual({
      user: winner,
      passwordHash: results[0] ? "hash-a" : "hash-b",
    });
    const authState = await repository.findAuthStateById(user._id);
    expect(authState).toStrictEqual({
      ...winner,
      passwordUpdatedAt: expect.any(Date) as Date,
    });
    expect(authState?.passwordUpdatedAt?.getTime()).toBeGreaterThanOrEqual(updateStartedAt);
    expect(authState?.passwordUpdatedAt?.getTime()).toBeLessThanOrEqual(updateFinishedAt);
    expect(
      await repository.updatePasswordIfCurrent(user._id, "already-hashed", "stale"),
    ).toBeNull();
    expect(await repository.findAuthStateById(user._id)).toStrictEqual(authState);
    expect(await repository.findCredentialsById(user._id)).toStrictEqual({
      user: winner,
      passwordHash: results[0] ? "hash-a" : "hash-b",
    });
  });
});
