This is a solid first pass — the domain thinking is clearly right. The `documents` / `sources` / `thesis_evidence` separation is exactly correct, and the `claims` table shows genuine architectural ambition. The conceptual model maps cleanly to the engine's responsibilities.

Here's my honest review before you move to the type-mapping phase:

---

## What's Strong

- **documents vs thesis_evidence** — correct. A document exists once; it becomes evidence only in the context of a thesis. Good.
- **sources vs source_endpoints** — correct. Reuters is a source; its RSS feed is an endpoint. This is the right split.
- **claims with subject/predicate/object** — this is an RDF triple structure. Powerful for the knowledge graph vision, but complex to populate reliably from LLMs. Worth keeping but flag it as hard.
- **thesis_forks** — a social/intellectual primitive that most tools miss. Good.
- **criteria with SUPPORT/FALSIFY/WATCH_SIGNAL** — maps exactly to the domain model.

---

## Gaps to Fix Before the Type Sheet

**1. thesis_evidence is missing key fields**

Based on the delta-scoring pipeline we discussed, you'll need:
- `delta_applied` — the actual confidence change this evidence caused (e.g. -3.0)
- `generated_by` — AI or USER (enum)
- `reasoning` — the LLM's explanation (the audit trail users trust)
- `criteria_id` — which specific criterion this evidence affects. Without this, you can't score per-criterion; you only get a global blob.

**2. No link between evidence and confidence history**

`thesis_confidence_history` has no reference back to the `thesis_evidence` row(s) that caused the change. You need `evidence_id` (or a junction table for multi-evidence updates) so the history is auditable.

**3. criteria is missing `weight`**

Not all criteria are equal. An investment thesis might weight "regulatory approval" at 40% and "market size" at 10%. Without weights, every criterion contributes equally and scoring will feel wrong.

**4. alerts is missing its enum**

`alert_type` has no definition. Candidates: `CONFIDENCE_THRESHOLD`, `FALSIFICATION_TRIGGERED`, `WATCH_SIGNAL_FIRED`, `NEW_EVIDENCE`, `STALE_THESIS`.

**5. users is missing role and subscription context**

At minimum: `role` (USER/ADMIN). If the credit-based monitoring system ever lands, `subscription_tier` or a separate `user_credits` table.

**6. No `thesis_follows` table**

The README mentions users follow theses. There's no table for that relationship yet (`user_id`, `thesis_id`, `created_at`).

**7. source_endpoints missing timestamps**

`created_at` and `updated_at` are absent. You'll want these for debugging ingestion issues.

**8. Credibility is on both documents and sources**

Decide: does document credibility inherit from the source, or is it assessed independently (e.g. a tabloid can publish a credible government document)? If independently assessed, keep both but document the relationship. If inherited, remove it from `documents`.

---

## One Structural Question

The `claims` table has no path to `criteria`. Right now a claim exists in isolation — you can't say "claim X supports criterion Y of thesis Z." You likely need a `claim_criteria` join table, or `thesis_evidence` needs a `claim_id` in addition to `document_id`. Think through how the scoring pipeline reads claims before finalizing.

---

## On Sequencing

Yes, schema design before implementation is the right call — this is step 1. The order I'd follow:

1. Fix the gaps above in DATABASE.md
2. Type/constraints spreadsheet (what you're about to do)
3. Migration script (SQL or TypeORM/Prisma schema)
4. Seed data for development
5. Then start the engine modules

The document is close. Address the `thesis_evidence` gaps and the missing `thesis_follows` table and it'll be ready to move to the type sheet.