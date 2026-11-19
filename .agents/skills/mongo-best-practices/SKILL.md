---
name: mongo-best-practices
description: MongoDB and Mongoose (Node.js/TypeScript) coding standards and query/schema best practices. Use whenever writing, reviewing, debugging, or refactoring Mongoose models, schemas, indexes, or database queries — including CRUD services/controllers, find/findOne/findById, updates, deletes, create/insertMany, bulkWrite, aggregation pipelines, populate, pagination, and transactions. Trigger automatically on any Mongoose codebase task even if "best practices" or "MongoDB" isn't mentioned explicitly (e.g., "add a field to this schema", "write the updateNote service", "add pagination to GET /users", "why is this query slow").
---

# MongoDB & Mongoose Best Practices

Coding standards and best practices for working with MongoDB and Mongoose. Follow these rules unless there is a clear business or technical reason not to (see Exceptions at the end).

## General Principles

- Prefer performance, readability, and maintainability.
- Retrieve only the data that is needed.
- Minimize database round trips.
- Use MongoDB atomic operators and conditional writes whenever possible.
- Keep queries index-friendly.
- Do not optimize prematurely, but avoid obvious anti-patterns.

## Query Guidelines

### Existence Check

**Do** use `Model.exists(filter)` when only checking whether a document exists.

**Don't** use `findOne({ email })` or `findById(id)` just to check existence.

### Use `.lean()`

**Do** use `.lean()` for read-only queries:

```ts
await User.find(filter).lean();
await User.findOne(filter).lean();
await User.findById(id).lean();
```

**Don't** return full Mongoose documents unless document methods, virtuals, middleware, or `.save()` are required.

### Use `findById()`

**Do**: `await User.findById(id);` (only for unscoped lookups; for tenant/owner-scoped queries, use `findOne({ _id: id, ...scope })`).

**Don't**: `await User.findOne({ _id: id });`

_(Reason: if `id` is `undefined`, `findById(undefined)` safely returns `null`, whereas `findOne({ _id: undefined })` can match an arbitrary document.)_

### Select Only Required Fields

**Do** retrieve only the fields that are needed:

```ts
.select("name email")
.populate("author", "name email")
```

**Don't** return every field when only a few are required.

### Populate

**Do** chain sorting, pagination, and limiting before `.populate()` for readability, and always use field selection inside `populate()`.

**Don't** populate every field, and don't try to filter or sort the parent query by a populated field — use an aggregation `$lookup` (or denormalization) instead.

### Distinct

**Do** use `Model.distinct("field", filter)` when you need a single-field array from a bounded dataset (e.g. fetching IDs to pass into a follow-up `$in` query) instead of `find(filter).select("field")` + `.map()`.

**Don't** use `User.find(filter).distinct("_id")`, and avoid `distinct()` on unbounded/very large collections (subject to MongoDB's 16 MB BSON limit) — paginate the source collection or use aggregation instead.

### Count

**Do**: `await User.countDocuments(filter);` (use `Model.estimatedDocumentCount()` when no filter is needed on large collections).

**Don't**: `await User.find(filter).countDocuments();`

### `Promise.all()`

**Do** use `Promise.all()` only for independent read queries (e.g. list + total count, user + settings, course + category).

**Don't** use it for dependent queries, for create/update/delete operations, inside a MongoDB transaction on the same `session`, or over unbounded arrays (`largeArray.map(...)`) which can exhaust the connection pool.

### Transactions

**Do** use transactions when multiple write operations must succeed or fail together. Always use `session.withTransaction()`, and explicitly pass `{ session }` to **every** query inside the callback.

**Don't** use transactions for every write, and **never** run `Promise.all()` with the same `session` inside a transaction.

### Bulk Operations

**Do** use `Model.insertMany()` for bulk inserts and `Model.bulkWrite()` for batched updates, upserts, or mixed writes.

**Don't** use `Model.create([...])` for bulk inserts unless middleware behavior is required.

### Single Insert

**Do**: `Model.create(data)` or `new Model(data).save()`. When passing a transaction session to `create()`, wrap in an array: `const [doc] = await Model.create([data], { session })` (or use `new Model(data).save({ session })`).

**Don't**: `Model.create([data])` outside of a session/options call.

### Update Queries

**Do** use atomic update operators: `$inc`, `$push`, `$pull`, `$addToSet`, `$unset`, `$set`. For decrement, use `$inc: { count: -1 }`.

**Do** pass `{ runValidators: true }` on `updateOne`, `updateMany`, and `findOneAndUpdate` so Mongoose enforces schema rules (`enum`, `min`, `max`, custom validators) on updates. Prefer `returnDocument: "after"` when returning the updated document.

**Don't** read a value, modify it in JavaScript, then write it back.

### Conditional (Guarded) Updates

**Do** encode preconditions directly in the update filter instead of doing `find()` -> JS `if` check -> `update()`. This prevents race conditions (TOCTOU) and keeps the happy path to a single atomic round-trip:

```ts
// State transition guard
await Post.findOneAndUpdate(
  { _id: postId, status: { $ne: "draft" } },
  { $set: { status: "draft" } },
  { returnDocument: "after", runValidators: true },
);

// Decrement with min check
await Product.findOneAndUpdate(
  { _id: productId, quantity: { $gt: 0 } },
  { $inc: { quantity: -1 } },
  { returnDocument: "after" },
);

// Increment with max check
await Product.findOneAndUpdate(
  { _id: productId, quantity: { $lt: MAX_QUANTITY } },
  { $inc: { quantity: 1 } },
  { returnDocument: "after" },
);
```

When `matchedCount === 0` (or `null` from `findOneAndUpdate`), run a lightweight read without the extra condition (`findById(id).select("status quantity").lean()`) only on that failure path to return a specific error message (e.g. "not found" vs. "out of stock" vs. "already a draft").

**Exception:** Never check salted password hashes (`bcrypt`/`argon2`) inside a MongoDB filter — fetch the stored hash with `.select("+password").lean()`, verify in application code, then update.

### Tenant & Owner Scoping (IDOR Prevention)

**Do** include the owner (`createdBy` / `userId`) or tenant (`organization` / `tenantId`) directly in the filter for `find`, `updateOne`, `findOneAndUpdate`, `deleteOne`, and `findOneAndDelete` — even when `_id` is already provided:

```ts
// Owner-scoped update
await Note.updateOne(
  { _id: noteId, createdBy: loggedInUserId },
  { $set: payload },
  { runValidators: true },
);

// Admin tenant-scoped update
await Note.updateOne(
  { _id: noteId, organization: loggedInAdminOrgId },
  { $set: payload },
  { runValidators: true },
);
```

**Don't** use `findByIdAndUpdate()` or `findByIdAndDelete()` on owner- or tenant-scoped resources, and don't fetch-then-check ownership in JS before updating.

**Failure handling:** For **tenant isolation**, return `404 Not Found` directly when `matchedCount === 0` (or `null`) so you don't leak whether an ID exists in another organization. Only perform a secondary lookup to return `403 Forbidden` vs. `404 Not Found` within the same tenant when business logic explicitly requires it.

### `updateOne()`

**Do** use `updateOne()` when the updated document is not needed. Use `findOneAndUpdate()` only when returning the updated document is necessary.

### Reference Fields & Input Safety

**Do** update reference (`ObjectId`) fields only when explicitly allowed by business logic, and validate/coerce all request inputs (e.g. with Zod) before passing them into query filters to prevent NoSQL injection (`{ $ne: null }`, etc.).

**Don't** spread `req.body` or `req.query` directly into filters or update queries.

### ObjectId Filters

**Do**: `{ user: user._id }`

**Don't**: `{ user }` _(fails when `user` is a plain object from `.lean()`)_

### Unique Validation

**Do** check unique fields before create/update for better UX, always enforce uniqueness with MongoDB unique indexes, and handle duplicate key errors (`err.code === 11000`) cleanly for concurrent requests.

**Don't** rely only on application-level validation.

### Delete Operations

**Do** clean up related documents when deleting data, if required by business logic. Always include tenant/owner scope in delete filters.

### Query Operators

**Do** prefer simple queries: `{ status: "ACTIVE" }`

**Don't** write `{ status: { $eq: "ACTIVE" } }` unless required. Avoid unnecessary `$and`.

### `$in` / `$nin`

**Do** use direct comparison when there is only one value: `{ role: "ADMIN" }` instead of `{ role: { $in: ["ADMIN"] } }`. Use `$ne` instead of `$nin` when there is only one excluded value.

### Aggregation

**Do** place `$match` as early as possible in the pipeline, project only required fields, and avoid unnecessary stages.

**Do** explicitly cast types inside `$match` (Mongoose does **not** auto-cast in `aggregate()` pipelines):

- Validate and convert string IDs with `new Types.ObjectId(id)` (after ensuring `Types.ObjectId.isValid(id)`).
- Convert date strings with `new Date(dateStr)`.

```ts
await Order.aggregate([
  {
    $match: {
      organization: new Types.ObjectId(orgId),
      createdAt: { $gte: new Date(fromDate) },
    },
  },
]);
```

### Avoid N+1 Queries

**Don't** loop with per-iteration queries:

```ts
for (...) {
    await User.findById(...)
}
```

**Do** fetch documents in batches instead (e.g. `$in` or `bulkWrite()`).

### Pagination

Always paginate list APIs. Never return unlimited documents. Prefer cursor-based pagination (filtering by `_id` or `{ createdAt, _id }`) over deep `.skip().limit()` on large datasets.

## Schema Guidelines

### `InferSchemaType`

Always use `InferSchemaType` for TypeScript schema types.

### Schema Options

**Do** enable `{ timestamps: true }` by default for `createdAt`/`updatedAt`, and keep `strictQuery: true` enabled to prevent unknown filter fields from being silently queried.

### Indexes

**Do** add indexes only for fields that are frequently filtered, sorted, joined, or searched (e.g. foreign keys, slug, email, username).

**Don't** index every field — indexes increase write cost.

### Compound Index

**Do** create compound indexes for fields commonly queried together, following the **ESR rule (Equality -> Sort -> Range)** for key ordering. Use `unique: true` only when uniqueness is actually required.

### Enum

Use `enum` whenever values are limited. Always define a default value if applicable.

### String Fields

Use `trim: true` for user-entered strings. Do not use `trim` for enum fields.

### Default Values

Provide sensible defaults whenever appropriate, especially for booleans, enums, arrays, and counters.

### Sensitive Fields

Use `select: false` for sensitive fields (e.g. `password`, `refreshToken`, `otp`, `secretKey`). Because `select: false` does not apply to `.create()` or `.save()`, always sanitize/strip sensitive fields before returning created or saved documents in API responses (via DTOs, serializers, or schema `toJSON` transforms).

## Performance Checklist

- Always use indexes (following ESR for compound indexes) for frequently executed queries.
- Prefer aggregation over multiple queries when appropriate.
- Prefer batching (`$in`, `insertMany`, `bulkWrite`) over repeated database calls.
- Prefer atomic conditional updates over read-check-write flows.
- Use `distinct()` on bounded datasets instead of loading unnecessary documents.
- Retrieve only the required fields.
- Use `.lean()` for read-only operations.
- Avoid unnecessary `populate()` on large lists.

## Exceptions

These rules are guidelines, not absolutes. A rule may be ignored when there is a clear business requirement, correctness issue, or measurable performance benefit — but the deviation should be intentional, not accidental.
