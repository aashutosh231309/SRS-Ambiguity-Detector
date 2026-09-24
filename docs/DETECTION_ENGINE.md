# Deterministic Ambiguity Detection Engine

The SRS Ambiguity Detector does **not** depend on an LLM to decide whether a requirement is ambiguous. The core analysis is deterministic and runs without any AI provider key.

The detector identifies patterns that **may indicate ambiguity or insufficient precision**. Findings are review aids, not proof that a requirement is objectively wrong.

## Pipeline

```text
SRS text or extracted document text
  → normalization
  → deterministic requirement segmentation
  → detector registry
  → finding deduplication
  → scoring and health dimensions
  → database persistence
  → report UI
  → optional AI enhancement
```

Implementation entry points:

- `backend/app/services/segmentation.py` — deterministic requirement segmentation.
- `backend/app/analysis/detectors.py` — 11 detector functions and registry order.
- `backend/app/analysis/engine.py` — deduplication, scoring, bands, health dimensions.
- `backend/app/services/analysis.py` — orchestration and persistence.

## Implemented detector categories

| Detector id | Category | What it detects | Why it matters | Example | Improvement direction |
| --- | --- | --- | --- | --- | --- |
| `vague-quantifier` | Vague quantifiers | Words such as “some”, “many”, “few”, “several”, and similar quantity terms. | Quantity is unclear and may be interpreted differently by developers/testers. | “The system shall support several users.” | Replace with measurable counts or ranges. |
| `subjective-term` | Subjective terms | Words such as “fast”, “quickly”, “easy”, “user-friendly”, or “robust”. | The quality attribute is subjective unless a measurable target is provided. | “The system shall respond quickly.” | Add objective thresholds, conditions, or acceptance criteria. |
| `missing-measurable-criteria` | Missing measurable criteria | Performance/quality claims without measurable criteria. | A requirement may be impossible to verify in testing. | “The system shall load reports efficiently.” | Define response time, load, success criteria, or test conditions. |
| `pronoun-reference` | Pronoun references | Pronouns or demonstratives whose referent may be unclear. | Readers may disagree about what “it”, “they”, “this”, or “that” refers to. | “When the service receives a request, it validates it.” | Repeat the noun or split the requirement for clarity. |
| `optional-language` | Optional language | Words such as “may”, “might”, “could”, “if possible”, or “as needed”. | Optional wording can obscure whether behavior is mandatory. | “The system may send an alert if possible.” | State whether the behavior is required and under which conditions. |
| `ambiguous-operator` | Ambiguous operators | Operators such as “and/or”, “etc.”, “and so on”, or ambiguous use of “or”. | Scope and obligation may be unclear. | “The user can export PDF and/or CSV reports.” | Enumerate exact alternatives and required combinations. |
| `undefined-terminology` | Undefined terminology | Capitalized or domain-like terms that may lack a definition in context. | Unshared vocabulary can create inconsistent implementation assumptions. | “The system shall notify Premium Users.” | Define the term or reference a glossary/business rule. |
| `absolute-language` | Absolute language | Words such as “always”, “never”, “all”, “every”, “completely”, or “instant”. | Absolutes often need exceptions, operating conditions, or tolerance. | “The system shall always be available.” | Add availability target, exclusions, and measurement window. |
| `passive-actor` | Passive voice / unclear actor | Passive constructions where the responsible actor is unclear. | Responsibility may be ambiguous. | “The report shall be approved before release.” | Name the actor or system component that performs the action. |
| `missing-constraint` | Missing constraints | Requirements that describe behavior but omit important constraints. | Implementation and verification need boundaries such as load, timing, formats, or conditions. | “The system shall store audit logs.” | Add retention, access, format, volume, and security constraints. |
| `incomplete-requirement` | Incomplete requirements | Fragments, placeholders, dangling modal verbs, or unfinished statements. | The requirement cannot be implemented or tested reliably. | “The system shall TBD.” | Replace with a complete actor/action/object/condition statement. |

The original project specification listed 13 conceptual categories. The implemented engine currently uses 11 production detectors; missing conditions and missing actor/responsibility are represented by the `missing-constraint`, `passive-actor`, and `incomplete-requirement` detectors rather than separate route-level categories.

## Finding shape

Every finding includes:

- stable detector id;
- user-facing category;
- severity: `low`, `medium`, `high`, or `critical`;
- matched phrase;
- requirement-relative start/end offsets;
- human-readable reason;
- recommendation.

Offsets index the individual requirement text, not the full uploaded document.

## Deduplication

The engine runs every detector, then deduplicates findings deterministically:

1. exact duplicates with the same detector and span collapse to one finding;
2. identical spans from different detectors collapse to the higher-severity finding;
3. overlapping but different spans are preserved when they represent distinct concerns.

Registry order is the tie-breaker for equal-severity identical spans.

## Scoring

Scoring is transparent and heuristic:

```text
Requirement score = clamp(100 - Σ severity deductions, 0, 100)
```

Deduction table:

| Severity | Deduction |
| --- | ---: |
| low | 5 |
| medium | 10 |
| high | 15 |
| critical | 20 |

Analysis score is the arithmetic mean of requirement scores, using half-up rounding.

Bands:

| Score | Band |
| --- | --- |
| 80–100 | `low` ambiguity |
| 60–79 | `moderate` ambiguity |
| 40–59 | `high` ambiguity |
| 0–39 | `very_high` ambiguity |

The score is an analytical indicator for triage and comparison within the tool. It is not a formal certification of SRS quality.

## Health dimensions

The same deductions also feed four explainable health dimensions:

| Dimension | Detector ids |
| --- | --- |
| `measurability` | `subjective-term`, `missing-measurable-criteria` |
| `specificity` | `vague-quantifier`, `undefined-terminology`, `absolute-language` |
| `clarity` | `pronoun-reference`, `ambiguous-operator`, `optional-language`, `passive-actor` |
| `completeness` | `missing-constraint`, `incomplete-requirement` |

There is no hidden weighting beyond the severity deduction table.
