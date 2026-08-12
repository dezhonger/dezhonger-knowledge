---
title: About
description: Why Dezhonger Knowledge exists and how its content is maintained.
---

# About this site

Dezhonger Knowledge is a bilingual collection of original technical notes by Dezhonger. It complements the [interactive tools and personal service](https://150.109.77.66/?lang=en) without sharing their application code or release cycle.

## Editorial principles

- **Evidence before labels.** A timeout, HTTP 200, or passing workflow is a signal—not a complete conclusion.
- **Boundaries matter.** Network, application, database, and model behavior are explained as connected stages.
- **Exact where possible.** Commands, inputs, outputs, constraints, and failure conditions are preferred over vague summaries.
- **Small enough to reuse.** Articles should help during a real implementation or incident, not only during linear reading.

## Technology

The site is written in Markdown, built with VitePress, and deployed as an independent static Docker container. Search runs locally in the browser. The public web server routes `/knowledge/` to this container while the tools, API, memo, and database remain in the separate `dezhonger-service` deployment.

## Contributions

Each page has an edit link. Corrections and focused additions are welcome through GitHub. Articles should remain original and should cite external material when a claim depends on it.
