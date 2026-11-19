---
name: mongo-best-practices
description: Coding standards and best practices for MongoDB and Mongoose (Node.js/TypeScript). Use this whenever writing, reviewing, or refactoring any code that queries or defines schemas with Mongoose — including Model.find/findOne/findById, updates, aggregation pipelines, populate, transactions, bulk writes, or schema definitions. Trigger this even if the user doesn't say "best practices" explicitly — e.g. "write a query to fetch users", "add a field to this schema", "why is this MongoDB query slow", "review my Mongoose model". Covers query patterns (.lean(), exists(), distinct(), countDocuments()), atomic update operators, Promise.all() usage, transactions, indexing, and schema conventions.
---

# MongoDB & Mongoose Best Practices

Coding standards and best practices for working with MongoDB and Mongoose. Follow these rules unless there is a clear business or technical reason not to (see Exceptions at the end).

## General Principles

- Prefer performance, readability, and maintainability.
- Retrieve only the data that is needed.
- Minimize database round trips.
- Use MongoDB atomic operators whenever possible.
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

**Do**: `await User.findById(id);`

**Don't**: `await User.findOne({ _id: id });`

### Select Only Required Fields

**Do** retrieve only the fields that are needed:

```ts
.select("name email")
.populate("author", "name email")
```

**Don't** return every field when only a few are required.

### Populate

**Do** apply sorting, pagination, and limiting before calling `.populate()` whenever possible. Always use field selection inside `populate()`.

**Don't** populate every field.

### Distinct

**Do** use `Model.distinct()` when only one field is required: `User.distinct("_id", filter)`

**Don't**: `User.find(filter).distinct("_id")`

### Count

**Do**: `await User.countDocuments(filter);`

**Don't**: `await User.find(filter).countDocuments();`

### `Promise.all()`

**Do** use `Promise.all()` only for independent read queries (e.g. list + total count, user + settings, course + category).

**Don't** use it for dependent queries, or for create/update/delete operations.

### Transactions

**Do** use transactions when multiple write operations must succeed or fail together. Always use `session.withTransaction()`.

**Don't** use transactions for every write.

### Bulk Insert

**Do** use `Model.insertMany()` for bulk inserts.

**Don't** use `Model.create([...])` unless middleware behavior is required.

### Single Insert

**Do**: `Model.create(data)` or `new Model(data).save()`

**Don't**: `Model.create([data])`

### Update Queries

**Do** use atomic update operators: `$inc`, `$push`, `$pull`, `$addToSet`, `$unset`, `$set`. For decrement, use `$inc: { count: -1 }`.

**Don't** read a value, modify it in JavaScript, then write it back.

### `updateOne()`

**Do** use `updateOne()` when the updated document is not needed. Use `findOneAndUpdate()` only when returning the updated document is necessary.

### Reference Fields

**Do** update reference (`ObjectId`) fields only when explicitly allowed by business logic.

**Don't** spread `req.body` directly into update queries.

### ObjectId Filters

**Do**: `{ user: user._id }`

**Don't**: `{ user }`

### Unique Validation

**Do** check unique fields before create/update for better UX, and always enforce uniqueness with MongoDB unique indexes.

**Don't** rely only on application-level validation.

### Delete Operations

**Do** clean up related documents when deleting data, if required by business logic.

### Query Operators

**Do** prefer simple queries: `{ status: "ACTIVE" }`

**Don't** write `{ status: { $eq: "ACTIVE" } }` unless required. Avoid unnecessary `$and`.

### `$in` / `$nin`

**Do** use direct comparison when there is only one value: `{ role: "ADMIN" }` instead of `{ role: { $in: ["ADMIN"] } }`. Use `$ne` instead of `$nin` when there is only one excluded value.

### Aggregation

**Do** place `$match` as early as possible in the pipeline, project only required fields, and avoid unnecessary stages.

### Avoid N+1 Queries

**Don't** loop with per-iteration queries:

```ts
for (...) {
    await User.findById(...)
}
```

**Do** fetch documents in batches instead.

### Pagination

Always paginate list APIs. Never return unlimited documents.

## Schema Guidelines

### `InferSchemaType`

Always use `InferSchemaType` for TypeScript schema types.

### Indexes

**Do** add indexes only for fields that are frequently filtered, sorted, joined, or searched (e.g. foreign keys, slug, email, username).

**Don't** index every field — indexes increase write cost.

### Compound Index

**Do** create compound indexes for fields commonly queried together. Use `unique: true` only when uniqueness is actually required.

### Enum

Use `enum` whenever values are limited. Always define a default value if applicable.

### String Fields

Use `trim: true` for user-entered strings. Do not use `trim` for enum fields.

### Default Values

Provide sensible defaults whenever appropriate, especially for booleans, enums, arrays, and counters.

### Sensitive Fields

Use `select: false` for sensitive fields (e.g. password, refreshToken, otp, secretKey).

## Performance Checklist

- Always use indexes for frequently executed queries.
- Prefer aggregation over multiple queries when appropriate.
- Prefer batching over repeated database calls.
- Use `distinct()` instead of loading unnecessary documents.
- Retrieve only the required fields.
- Use `.lean()` for read-only operations.
- Avoid unnecessary `populate()` on large lists.

## Exceptions

These rules are guidelines, not absolutes. A rule may be ignored when there is a clear business requirement, correctness issue, or measurable performance benefit — but the deviation should be intentional, not accidental.
