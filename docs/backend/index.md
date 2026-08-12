---
title: Backend engineering
description: Practical notes on APIs, Go services, data, security, and deployment.
---

# Backend engineering

A backend is not just an HTTP handler connected to a database. It is a set of boundaries: which inputs are trusted, where invariants are enforced, how state changes, and what evidence remains after a failure.

## Start with the service boundary

A maintainable service should make four things easy to answer:

1. What does the service own?
2. Which operations can change that state?
3. Which failures are safe to retry?
4. How can an operator prove what happened?

The first article applies these questions to a small Go service without turning it into a framework.

## Articles

- [Designing a small Go service](/backend/go-service-design) — separate transport, business rules, persistence, and runtime configuration while keeping the code navigable.

## Planned series

- PostgreSQL schema and migration design
- Sessions, cookies, and authorization boundaries
- Idempotency and safe retries
- Caching without hidden inconsistency
- Logs, metrics, traces, and health checks
- Docker and reverse-proxy deployment
