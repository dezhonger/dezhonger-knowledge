---
title: Designing a small Go service
description: A minimal Go service architecture that keeps transport, rules, persistence, and runtime concerns explicit.
---

# Designing a small Go service

The useful question is not “which Go framework should I use?” It is: **where should each decision live so a change does not leak through the whole service?**

## The four boundaries

```text
HTTP request
    │
    ▼
Transport ── decode, authenticate, encode
    │
    ▼
Application ── authorize, enforce use-case rules
    │
    ▼
Repository ── express reads and state transitions
    │
    ▼
PostgreSQL ── persist constraints and transactions
```

This is not a requirement to create four packages for every endpoint. It is a rule about ownership:

- HTTP status codes and headers belong to the transport boundary.
- “Only an administrator may create a user” belongs to the application boundary.
- SQL and database-specific errors belong to the repository boundary.
- Uniqueness, foreign keys, and transactional integrity also belong in the database.

## A compact project shape

```text
cmd/api/main.go          process startup and shutdown
internal/app/            use cases and HTTP composition
internal/store/          PostgreSQL queries and transactions
internal/auth/           password, session, and policy helpers
internal/migrations/     versioned schema changes
```

Start compact. Split a package when it has a distinct reason to change, not because a diagram says every box must be a directory.

## Keep handlers boring

A handler should make the request lifecycle visible:

```go
func (h *Handler) createNote(w http.ResponseWriter, r *http.Request) {
    user := auth.UserFromContext(r.Context())

    var input CreateNoteInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_request")
        return
    }

    note, err := h.notes.Create(r.Context(), user.ID, input)
    if err != nil {
        h.writeApplicationError(w, err)
        return
    }

    writeJSON(w, http.StatusCreated, note)
}
```

Decoding, calling one use case, and mapping the result are enough. Validation that defines the business object should be reusable outside HTTP.

## Put invariants in more than one layer

Application validation gives precise errors. Database constraints protect state under concurrency and from other writers.

For a unique username:

1. Normalize and validate before querying.
2. Declare a unique constraint in PostgreSQL.
3. Translate the constraint violation into a stable application error.

Checking first without a constraint leaves a race. Relying only on a constraint produces a poor API unless the error is translated.

## Configuration is part of the interface

Read runtime configuration once during startup, validate it, and pass typed dependencies inward. Avoid reading environment variables from handlers: it hides configuration errors until a particular request path runs.

At minimum, fail startup when these are invalid:

- listen address;
- database URL;
- public origin and cookie security mode;
- session duration;
- required secrets.

## Shutdown is a state transition

Graceful shutdown is not just catching `SIGTERM`. The service must stop accepting new work, give active requests a bounded completion window, and then close database resources.

The timeout matters. An unbounded shutdown can block a deployment forever; an immediate exit can interrupt a committed response or leave clients retrying an ambiguous operation.

## Review checklist

- Can a reader find startup, routing, business rules, and SQL quickly?
- Are authentication and authorization separate decisions?
- Do database constraints protect the same invariants as application validation?
- Are retryable and non-retryable failures distinguishable?
- Does the health endpoint test the dependency it claims to represent?
- Can the process shut down within a known bound?

The architecture is successful when these questions stay easy to answer as the service grows.
