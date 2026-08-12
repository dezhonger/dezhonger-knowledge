---
title: AI engineering
description: Practical notes on embeddings, retrieval, ranking, agents, and evaluation.
---

# AI engineering

AI systems are software systems with an additional probabilistic component. Reliable behavior still depends on explicit contracts: which data enters the model, which vector space is used, how candidates are filtered, and how quality is measured.

## Separate the pipeline

Retrieval quality should be decomposed into stages:

```text
content → representation → index → candidate retrieval → filtering → ranking → response
```

Changing the model cannot fix a filter that removes the correct candidate. Increasing the retrieval limit cannot repair embeddings from incompatible vector spaces.

## Articles

- [Embedding search in practice](/ai/embedding-search) — define vector compatibility, retrieval boundaries, filters, ranking, and evaluation before tuning similarity thresholds.

## Planned series

- Chunking and document structure
- Hybrid lexical and vector retrieval
- Reranking and score calibration
- RAG evaluation datasets
- Agent tools, state, and failure recovery
- Tracing model calls without leaking sensitive data
