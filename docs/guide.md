---
title: How to use this site
description: A map of Dezhonger Knowledge and its writing principles.
---

# How to use this site

Dezhonger Knowledge is organized by the system boundary you are trying to understand, not by a sequence you must finish.

## Choose a path

| If you are asking… | Start with |
| --- | --- |
| How should an API or service be structured? | [Backend engineering](/backend/) |
| Where did this request fail? | [Computer systems](/systems/) |
| Why is retrieval or ranking weak? | [AI engineering](/ai/) |

Every section has an overview that defines its scope and a set of focused articles. Cross-links connect concepts when one layer affects another.

## The article pattern

Most articles follow the same shape:

1. **Question** — the practical problem the article answers.
2. **Model** — the smallest accurate mental model.
3. **Mechanism** — what actually happens at runtime.
4. **Failure modes** — where the model breaks in production.
5. **Checklist** — evidence to collect before drawing a conclusion.

The goal is not to memorize more terms. It is to make the next diagnosis or design decision more precise.

## Language

English is the default language. Use the language menu in the navigation bar to switch to Simplified Chinese. The two versions share the same information architecture and are maintained as separate Markdown sources so technical wording can stay natural in both languages.

## What comes next

The initial library establishes three foundations: a small Go service, the lifecycle of a network request, and embedding search. Upcoming series will expand into PostgreSQL, caching, authentication, observability, distributed consistency, retrieval pipelines, and agent evaluation.
