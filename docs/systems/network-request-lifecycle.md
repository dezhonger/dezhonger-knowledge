---
date: 2026-08-12
title: A network request, end to end
description: A stage-by-stage model for diagnosing DNS, routes, proxies, TCP, TLS, HTTP, and application behavior.
---

# A network request, end to end

When a request fails, “the network” is too broad to be useful. The fastest diagnosis identifies the last stage that definitely succeeded and the first stage that did not.

## The path is longer than the URL

```text
Application
  → name resolution
  → local route or TUN device
  → optional proxy
  → TCP connection
  → TLS handshake
  → HTTP exchange
  → reverse proxy
  → application
  → database or downstream service
```

The visible hostname does not always reveal the real connection target. A proxy may receive the hostname and open the remote connection itself. A TUN client may return a synthetic address and intercept traffic before the operating system reaches the public network.

## 1. Name resolution

Record the resolver result and who produced it. A normal public address, a private address, and a synthetic address such as one from a Fake-IP range imply different paths.

Useful questions:

- Did the application use the system resolver, DNS-over-HTTPS, or a proxy resolver?
- Is the answer cached?
- Does the proxy receive a hostname or an already-resolved address?

Changing an environment variable such as `HTTPS_PROXY` does not change a TUN route or a DNS interception rule.

## 2. Route and proxy selection

A successful `connect()` call only proves that something accepted the socket. With a local tunnel, that “something” may be the tunnel process—not the remote server.

Collect both sides of the decision:

- the operating-system route and interface;
- the proxy or tunnel connection record and matched rule.

If the intended policy is direct access for one destination, verify the runtime rule match. Editing a profile file without confirming that the running process reloaded it is not sufficient.

## 3. TCP connection

TCP establishes a byte stream. It does not authenticate the server or prove that the expected protocol is speaking.

`nc -vz host 5432` can report success through an intercepting proxy even when the server has no PostgreSQL listener. Send a protocol-specific handshake or inspect the server listener before concluding that the database is exposed.

## 4. TLS handshake

TLS adds three separate claims:

1. an encrypted session was negotiated;
2. the certificate chain is trusted;
3. the certificate identity matches the hostname or IP.

Disabling verification hides evidence and creates a new security problem. Inspect the certificate, SNI, trust store, and handshake error instead.

## 5. HTTP and application semantics

An HTTP response proves that an HTTP-speaking component answered. It may be a proxy error page, a reverse-proxy fallback, or the intended API.

Validate:

- status code;
- content type and stable response fields;
- request ID or server identity when available;
- domain-specific counts and boundaries.

For data APIs, HTTP 200 is the beginning of validation—not the end.

## A practical evidence table

| Stage | Strong evidence | What it does not prove |
| --- | --- | --- |
| DNS | resolver and returned address | route actually used |
| Route | interface and matched proxy rule | remote protocol accepted |
| TCP | completed three-way handshake | server identity |
| TLS | verified certificate and session | application correctness |
| HTTP | expected status and schema | data completeness |
| Application | boundary checks against source data | unrelated endpoints work |

## Diagnostic order

1. Record the exact command, URL, and time.
2. Inspect the blocked process and its current connection target.
3. Verify resolution and route selection.
4. Test the actual protocol—not only TCP reachability.
5. Compare client evidence with server listeners and logs.
6. Change one scoped variable, then repeat the same test.

This order turns a vague network problem into a bounded stage failure.
