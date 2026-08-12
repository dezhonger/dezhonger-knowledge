---
title: Computer systems
description: Follow real operations through networks, operating systems, proxies, and databases.
---

# Computer systems

Systems knowledge becomes useful when it explains an observed runtime event. “The port is reachable” and “the SSH server accepted the connection” are different claims. “The API returned 200” and “the returned data is complete” are different claims.

## Think in stages

For any operation, write down its stages and the evidence produced by each one. A browser request may cross DNS, a local tunnel, a proxy, TCP, TLS, Nginx, an application handler, and PostgreSQL. Each stage can succeed while the next fails.

## Articles

- [A network request, end to end](/systems/network-request-lifecycle) — identify the actual endpoint and distinguish name resolution, routing, transport, encryption, HTTP, and application behavior.

## Planned series

- Processes, file descriptors, and sockets
- TCP retransmission and timeout interpretation
- TLS certificates and trust chains
- Reverse proxies and load balancers
- Database connections, locks, and isolation
- Containers, namespaces, and host networking
