Good clarification. "Human review" doesn't mean a team — it means *the thesis owner* is the reviewer. Here's how I'd architect this to be credible without a review staff:

---

## The Core Problem with LLM Confidence Scores

Asking an LLM "what's the confidence in this thesis?" open-endedly gives you:
- Inconsistent numbers across runs
- Poorly calibrated absolute values (it has no memory of prior scores)
- No auditability — the user can't see *why* 72%

---

## The Fix: Delta Scoring Against Explicit Criteria

**Never score globally. Score deltas against the thesis's own criteria.**

```
User defines thesis → declares criteria → sets baseline confidence

For each piece of incoming evidence:
  Step 1: Is this evidence relevant? (binary, cheap)
  Step 2: Which criteria does it affect? (classification)
  Step 3: What direction? (positive / negative / neutral)
  Step 4: What magnitude? (strong / moderate / weak / negligible)
  → Map to a delta: e.g. moderate negative on criterion #2 = -3%

Confidence = baseline + Σ(all deltas over time)
```

This is far more consistent than asking for an absolute score each time because the LLM is answering smaller, more constrained questions.

---

## Practical Calibration Techniques

**1. Multi-step pipeline, not one-shot scoring**
```
Prompt A: "Is this article relevant to [thesis]? Yes/No + one sentence why."
  → if No: discard, no score change
Prompt B: "Which of these criteria does it touch? [list criteria]"
Prompt C: "For each affected criterion: does this strengthen or weaken it, and how strongly?"
Prompt D: "Translate to a confidence delta using this scale: [anchor table]"
```
Each step is easy for the LLM. Chaining them gives you a defensible audit trail.

**2. Anchor the scoring with examples at thesis creation**
When the user creates a thesis, have them answer:
- "What would make you 100% certain this is true?"
- "What would falsify it immediately?"
- "Give an example of strong evidence for it and weak evidence against it"

These become few-shot examples in every scoring prompt. The LLM is now calibrated to *this thesis's* evidence scale, not its generic prior.

**3. Ensemble for high-stakes updates**
For large deltas (>5%), run the scoring prompt 3 times and take the median. Flag high variance to the user: "This evidence was scored inconsistently — confidence range: 62–74%."

---

## The Owner IS the Reviewer

The UI does the lightweight review work:

```
"3 articles this week affected your thesis:

  Reuters: FDA clears competing product → -4%
  Bloomberg: Your target company Q3 beat → +3%
  TechCrunch: Tangential product launch → no change

Net: 72% → 71%. [Accept] [Override] [Review each]"
```

One-click accept is the default. Override feeds back into calibration. Over 10-20 accepts/overrides, you have thesis-specific calibration data that can tune future scoring — no review team needed.

---

## What Builds Trust

The score number matters less than the **evidence trail**. Users trust "71% because of these 4 pieces of evidence, here's how each moved it" far more than "71%" alone. The audit log *is* the trust mechanism.

The biggest mistake would be surfacing a single percentage with no path to "why." Even if the number is slightly off, transparency about the reasoning keeps users engaged rather than dismissive.