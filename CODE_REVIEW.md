# Code Review — backend-template

**Date:** 2026-11-17
**Scope:** Full codebase review (`src/`), with attention to the most recent change
`feat(validateRequest): support validating params and query targets` (4d0b90c).
**Verification:** `pnpm typecheck` passes cleanly.

Overall the codebase is well-structured and consistent: `catchAsync` wrapping,
the `sendResponse` envelope, the frozen `env` object, and soft-failing cache
helpers are all applied uniformly. Findings below are mostly low severity; none
block merge.

---

## Bugs / Correctness

### 1. Duplicate-key error message is grammatically wrong and can expose the field value

**File:** `src/middleware/globalErrorhandler.ts:52-57` — Low

```ts
const match = /"([^"]*)"/.exec(err.message);
const extractedMessage = match?.[1];
message = `${extractedMessage} is already exists`;
```

Two issues:

- `"${extractedMessage} is already exists"` is not valid English. It should read
  `"... already exists"`.
- For a Mongo E11000 error, the text captured between the first pair of quotes is
  the **duplicated value** (e.g. the user's email), not the field name. The
  response then becomes `"user@example.com is already exists"`, echoing the
  submitted value back to the client. For the current `User` model the only
  unique field is `email`, so this leaks the email that was attempted. This only
  matters on endpoints where returning the raw value is undesirable; for a public
  registration form it is a minor information disclosure.

Consider deriving the message from the index/field name instead of the value, and
fixing the grammar.

### 2. Email is not normalized, so uniqueness is case-sensitive

**Files:** `src/modules/user/user.model.ts:19-25`, `src/modules/auth/auth.service.ts:10-53` — Low/Medium

The `email` field is `trim`ed but never lowercased, and neither
`registerUserToDb` nor `loginUserFromDb` normalizes case. As a result:

- `User@example.com` and `user@example.com` are treated as two distinct accounts
  and both can register.
- A user who registers with `User@example.com` and later logs in with
  `user@example.com` will fail the `findOne({ email })` lookup and get
  "Invalid email or password".

This surfaces whenever clients send inconsistent casing (common with mobile
keyboards and autofill). Lowercasing the email at validation or model level
(`lowercase: true` on the schema, or a Zod transform) resolves both.

---

## Observations (no change required, worth confirming intent)

### 3. `validateRequest` query handling is correct for Express 5

**File:** `src/middleware/validateRequest.ts:20-29`

The `Object.defineProperty` approach for `req.query` is the right workaround for
Express 5 exposing `query` as a non-writable getter, and the inline comment
explains why. No issue — flagging only because this was the change under review
and the behavior is subtle. The `ZodType` widening (from `ZodObject`) is also
appropriate now that params/query schemas may be non-object refinements.

### 4. `changePasswordToDb` re-validates already-validated input

**File:** `src/modules/auth/auth.service.ts:55-78`

`changePasswordSchema` guarantees `currentPassword`/`newPassword` are present and
trimmed, yet the service uses optional chaining (`currentPassword?.trim()`) and
non-null assertions (`newPassword!`). This is harmless but mixes two contradictory
assumptions about whether the fields can be missing. Since the route always runs
`validateRequest(changePasswordSchema)` first, the optional chaining and the
re-`trim()` are dead defensiveness. Not a bug.

### 5. `cacheRoute` types cached data as `AnyObject`

**File:** `src/middleware/cacheRoute.ts:35`

`getCache<AnyObject>(...)` assumes cached payloads are objects, but `setRouteCache`
accepts `unknown` and the response envelope supports arrays
(`ResponseData = AnyObject | unknown[]`). If an array is cached and later served,
the generic is inaccurate. Runtime behavior is fine (it is round-tripped JSON);
this is only a typing imprecision.

### 6. `getCache` cannot distinguish a stored `null`/`undefined` from a miss

**File:** `src/utils/redis.ts:44-62`

A miss returns `undefined`, and `cacheRoute` treats anything `!== undefined` as a
hit. Storing a value that serializes to `null` (e.g. `setCache(key, null)`) will
be returned as a cache hit of `null`, which is likely the intended behavior, but
callers should be aware that `undefined` is reserved for miss/error. No action
needed unless you intend to cache nullish values distinctly.

---

## Security notes (positive / confirmations)

- `loginUserFromDb` compares against a `DUMMY_HASH` when the user is absent
  (`auth.service.ts:37`) to blunt timing-based user enumeration. Good.
- The global error handler masks all 500-level messages
  (`globalErrorhandler.ts:75-78`) and only attaches stack traces in development.
  Good.
- The logger redacts passwords, emails, tokens, and auth headers
  (`logger.ts:43-65`). Note this redaction does **not** cover the duplicate-key
  message in finding #1, since that value is placed into `message`, not a redacted
  key path.
- Upload validators (`uploader.ts`, `memory.uploader.ts`) verify real magic bytes
  rather than trusting the client MIME type, and clean up rejected files. Good.
- `authCheck` invalidates tokens on password/email/role change
  (`authCheck.ts:43-58`). Good.

---

## Summary

| #   | Severity | File                           | Issue                                                   |
| --- | -------- | ------------------------------ | ------------------------------------------------------- |
| 1   | Low      | globalErrorhandler.ts          | Duplicate-key message grammar + echoes submitted value  |
| 2   | Low/Med  | user.model.ts, auth.service.ts | Email not lowercased → case-sensitive uniqueness/login  |
| 3   | —        | validateRequest.ts             | Query handling reviewed, correct                        |
| 4   | Info     | auth.service.ts                | Redundant defensiveness on validated input              |
| 5   | Info     | cacheRoute.ts                  | Cached-data typed as object, arrays possible            |
| 6   | Info     | redis.ts                       | `undefined` reserved for miss; stored nullish ambiguity |

No blocking issues. Findings #1 and #2 are the only ones with user-visible impact
and are both low-effort to address.
