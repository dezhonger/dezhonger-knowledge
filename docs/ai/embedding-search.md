---
title: Embedding search in practice
description: A production model for vector compatibility, candidate retrieval, filtering, ranking, and evaluation.
---

# Embedding search in practice

Embedding search maps an input into a vector and retrieves nearby vectors. The formula is simple; the production contract is not.

## A vector has an identity

Dimension alone does not define compatibility. Two 512-dimensional embeddings from different models are normally in different vector spaces and cannot be compared meaningfully.

A usable vector contract includes:

- model and exact version;
- preprocessing steps;
- output dimension;
- normalization policy;
- similarity function;
- entity represented by the vector;
- migration or re-index version.

Treat these fields like a database schema. A silent model change without re-indexing is a data compatibility bug.

## Retrieval is a pipeline

```text
Query
  │
  ├─ encode with the matching model
  │
  ├─ apply tenant, site, time, and entity filters
  │
  ├─ retrieve Top K candidates
  │
  ├─ rerank with richer signals
  │
  └─ group, paginate, and explain results
```

The order changes semantics. Global Top K followed by grouping is not equivalent to Top K per group. A strict filter before retrieval can improve precision and latency; the same filter can destroy recall if its source metadata is incomplete.

## Cosine similarity

For non-zero vectors $x$ and $y$:

$$
\operatorname{cosine}(x,y)=\frac{x\cdot y}{\lVert x\rVert\lVert y\rVert}
$$

If all vectors are normalized to unit length, cosine similarity becomes a dot product. The implementation must still use the same normalization assumption for indexed and query vectors.

A threshold is not portable across models or datasets. Calibrate it from labeled examples, not from intuition about what “0.8” should mean.

## Candidate retrieval and final ranking

Approximate nearest-neighbor indexes trade exactness for speed. They should produce a candidate set large enough for the final ranking stage—not necessarily the final product order.

Reranking can combine:

- vector similarity;
- lexical match;
- freshness;
- entity confidence;
- business rules;
- a cross-encoder or multimodal model.

Keep the raw retrieval score and final ranking score distinguishable in logs. Otherwise a ranking regression looks like an indexing problem.

## Evaluation by failure type

Use a labeled query set and measure the stage that failed:

| Failure | Question |
| --- | --- |
| Representation | Are relevant items close in this vector space? |
| Filtering | Was the correct item removed before retrieval? |
| Candidate recall | Did Top K contain a relevant item? |
| Ranking | Was the relevant candidate ordered high enough? |
| Presentation | Was a correct result grouped or paginated away? |

Aggregate precision is useful, but stage-level labels tell you what to change.

## Production checklist

- Store model and preprocessing versions with every vector.
- Reject dimension or space mismatches explicitly.
- Define whether Top K is global or per group.
- Log filters, candidate counts, and ranking stages.
- Keep a stable evaluation set with difficult negative examples.
- Re-index intentionally when the vector contract changes.
- Compare latency and quality at realistic collection sizes.

Embedding search becomes manageable once each stage has an explicit contract and its own evidence.
