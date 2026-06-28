# Account Deletion — Backend Specification

This document specifies the backend functionality and endpoint required to
support the "Delete Account" feature that has already been implemented in the
mobile client. It describes behavior, contracts, and requirements only — not
implementation. It is intended to be handed to an agent working in the backend
repository.

## 1. Context

The mobile app lets a signed-in user permanently delete their account from the
Account screen. After a confirmation prompt, the client calls a single backend
endpoint and then tears down its local sessions.

Authentication and data are split across two providers:

- **Clerk** — identity / authentication provider. The user signs in with Clerk
  (Apple, Google, or email magic code).
- **InstantDB** — real-time database holding all of the user's content. The
  client bridges the Clerk identity into Instant via `signInWithIdToken`, so
  every Instant `$users` record corresponds to a Clerk user and shares the same
  email address.

Because the account spans both providers, deleting an account must remove the
user from **both** Clerk and InstantDB. The client cannot do this safely on its
own (it must not hold privileged admin credentials), so this work must happen
server-side behind an authenticated endpoint.

## 2. Endpoint

### `DELETE /api/account`

Deletes the authenticated user's account and all associated data.

- **Method:** `DELETE`
- **Path:** `/api/account` (relative to the API base URL the app already uses
  for `/api/recipes/ingredients-from-url`)
- **Authentication:** Required. `Authorization: Bearer <token>` where the token
  is a Clerk-issued token obtained from the client session (the same token type
  already accepted by the existing recipe-parsing endpoint).
- **Request body:** None. The user to delete is determined solely from the
  authenticated token; the endpoint must never accept a user id from the client.
- **Headers sent by client:** `Content-Type: application/json`,
  `Authorization: Bearer <token>`.

### Success response

- Any `2xx` status code is treated as success by the client (it does not read
  the response body). `200 OK` or `204 No Content` are both acceptable;
  `204 No Content` is recommended.

### Error response

On any non-`2xx` status, the client attempts to parse a JSON body of this shape:

```json
{
  "error": {
    "code": "<error_code>",
    "message": "<human-readable message>"
  }
}
```

- `error.message` is surfaced to the user verbatim in a toast, so it must be
  user-appropriate (no stack traces or internal detail).
- `error.code` values the client already understands:
  - `unauthorized` — missing/invalid/expired token, or token does not resolve to
    a user. Recommended status `401`.
  - `not_found` — the authenticated identity has no corresponding account to
    delete. Recommended status `404`.
  - `server_error` — any unexpected server-side failure. Recommended status
    `500`.
- If the body is missing or not valid JSON on an error response, the client
  falls back to a generic `server_error` message, so a JSON error body is
  strongly preferred but not strictly mandatory.

> Note: the client also defines a `config_error` code, but that is generated
> purely client-side (missing API URL) and will never be returned by the
> backend. No action needed.

## 3. Required behavior

When a valid request is received, the endpoint must, for the authenticated user:

1. **Resolve identity.** Validate the Clerk token and resolve it to the Clerk
   user and the corresponding InstantDB `$users` record (the two are linked by
   the same email / identity). If the token is invalid or expired, return
   `unauthorized`. If no matching account exists, return `not_found`.
2. **Delete all InstantDB data owned by the user** (see Section 4).
3. **Delete the InstantDB `$users` record.**
4. **Delete the Clerk user.**
5. **Return success** once both the Instant user and the Clerk user are deleted.

### Ordering, idempotency, and partial failure

- The operation should be **idempotent**: if the account (or one side of it) was
  already deleted, a repeat call should still converge to "fully deleted" and
  return success rather than erroring. For example, if the Instant data is gone
  but the Clerk user remains, the call should finish deleting the Clerk user and
  succeed.
- Avoid leaving the account in a half-deleted state. If one provider deletion
  succeeds and the other fails, return `server_error` so the client can prompt a
  retry; the retry must be safe (see idempotency above). Decide and document the
  ordering (a reasonable default: delete Instant data and the Instant user
  first, then the Clerk user, so that a failure leaves the identity intact and
  retryable rather than orphaning data behind a deleted identity).
- Deletion is permanent and unconditional from the user's perspective — there is
  no "soft delete" or recovery flow in the client. (Backups / legal retention as
  described in the privacy policy are a separate concern and out of scope for
  this endpoint's response contract.)

## 4. Data that must be deleted (InstantDB)

All of the user's content lives in InstantDB. Most content is linked to the
`$users` record with `onDelete: 'cascade'`, so deleting the `$users` record will
cascade automatically. The backend should confirm this cascade behavior and
explicitly handle the cases that are **not** covered by a cascade.

### Cascades automatically when the `$users` record is deleted

These entities have a cascading link to `$users` (directly or transitively):

- `saved_items` (linked to user, cascade)
- `grocery_lists` **owned** by the user (linked to user as `owner`, cascade),
  which in turn cascade to:
  - `grocery_items` on those lists
  - `grocery_list_shares` for those lists
  - `meal_plan_recipes` on those lists
  - `meal_plan_items` on those lists
- `recipes` (linked to user, cascade), which cascade to:
  - `recipe_ingredients`
- `stores` (linked to user, cascade)
- `categories` (linked to user, cascade)

### Does NOT cascade — must be handled explicitly

- **`grocery_list_shares` where the deleted user is a member (not the owner).**
  The share's membership is stored as a plain string field (`user_id`) rather
  than as a cascading link to `$users`. Deleting the user will **not** remove
  share rows that reference them as a member of *someone else's* list. The
  backend must find and delete all `grocery_list_shares` whose `user_id` equals
  the deleted user's id so that no dangling membership rows remain.

### Expected side effects (acceptable, call out for awareness)

- Lists **owned** by the deleted user that were shared with other people will be
  deleted along with their items and shares. Other members will lose access to
  those lists. This is expected behavior.
- Any other entity that references the user only by a non-cascading link or a
  string id should be audited; if new such relationships are added later, they
  must be added to the explicit-cleanup step above.

> The backend agent should verify the current schema links against this list
> rather than trusting it blindly, since the schema can evolve. The source of
> truth is `instant.schema.ts` in the mobile repo.

## 5. Security requirements

- The user to delete is derived **only** from the authenticated token. The
  endpoint must never accept or trust a user id, email, or any identifier from
  the request body or query string.
- A user may only delete **their own** account. There is no admin/impersonation
  path in this feature.
- Use privileged/admin credentials (Clerk admin API + Instant admin token) only
  on the server; these must never be exposed to the client.
- Validate the token on every request and reject expired or malformed tokens
  with `unauthorized`.

## 6. Client behavior (for context only)

After a successful (`2xx`) response, the client:

1. Signs out of Clerk and InstantDB locally.
2. Dismisses the account/settings UI and returns the user to the welcome screen.

The client suppresses its normal "session expired" messaging for this flow
because the sign-out is intentional. None of this requires backend action; it is
included only so the backend agent understands the full flow and that the
endpoint's only responsibility is the server-side deletion described above.

## 7. Acceptance criteria

- `DELETE /api/account` with a valid Clerk bearer token deletes the user from
  both InstantDB and Clerk and returns `2xx`.
- All InstantDB content listed in Section 4 is removed, including
  `grocery_list_shares` rows where the deleted user was a member of another
  user's list.
- Requests without a valid token return `unauthorized` and do not delete
  anything.
- Requests for an identity with no account return `not_found`.
- Unexpected failures return `server_error` with a JSON error body and a
  user-appropriate message.
- The endpoint is idempotent: repeating the call after a partial or full
  deletion still converges to "fully deleted" and returns success.
- No user id is ever read from the request input.
