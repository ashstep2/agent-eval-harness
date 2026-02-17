# Product Direction: Findings from the Coding Agent Evaluation Harness

## TLDR: What This Document Covers

This document answers 3 questions:
1. What the evaluation data says about how coding agents should be productized.
2. What product bets to make based on that data.
3. How to execute those bets in the first 90 days.

## Three Product Bets (Short Intro)

### Bet 1: Context is the moat, and Codex already leads here
Codex's largest measured advantage is context utilization. Product priority should be making this visible and compounding it with stronger codebase-awareness UX.

### Bet 2: Agent loops should be task-adaptive, not universal
Agent loops help most on verification-heavy tasks. Therefore, use loops when they’re most valuable (ex. tasks where checking and correcting matters, such as code review, debugging, audit). For tasks that require more judgement (initial direction matters more), start single-shot (extra steps can just reinforce the same bad plan). Therefore “task-adaptive” = choose workflow based on task type, not one workflow for everything.

### Bet 3: Trust surface matters more than capability surface
Codex wins mostly by being conservative and shippable. The winning UX is one that helps developers verify, calibrate, and confidently delegate.  

## Key Insights (From Current Runs)

1. **Codex wins** most head-to-head runs, with the biggest gap on context utilization.
2. Agent loops can reduce hallucination in review tasks, but do not reliably fix bad decisions.
3. Weight presets materially change score margins and strategic interpretation. (How we judge - a product decision - matters.)
4. Explanation quality alone is insufficient for autonomous delegation.
5. Judge-family scoring skew exists; cross-provider validation is needed.

---

## Why Build This

Generic benchmarks don't predict delegation behavior. For example, a model that scores 90% on human evaluations might still hallucinate bugs in a code review, break a public API during a refactor, or silently refuse a legitimate security task by exhausting its token budget.

This harness was built to test the capabilities that determine whether a developer will delegate to a coding agent (ex. whether the developer can trust what the model did and ship the result without a full audit).

**What this tests:**
- Real coding tasks (bugfix, refactor, code review, greenfield, performance) with fixture repos that have existing patterns
- 6 dimensions that map to delegation behavior
- Cross-provider dual-judge system that eliminates same-family scoring bias
- Weight presets that make evaluation criteria visible as a product decision
- Single-shot vs agent loop comparison to test whether more steps help

---

## Methodology

### 16 runs across 3 rounds

| Round | Runs | Mode | Scoring Preset | Purpose |
|-------|------|------|--------|---------|
| 1 | 10 | single_shot | developer_trust | Baseline head-to-head across all 10 tasks |
| 2 | 3 | single_shot | ship_fast | Test whether different weights change winners |
| 3 | 3 | agent_loop | developer_trust | Test whether multi-step reasoning improves quality |

### Cross-family dual-judge system

Every response is scored by two judges from different providers:
- **Claude Sonnet 4**: scores OpenAI models
- **GPT-5.2**: scores Anthropic models

The **cross-family judge** determines the winner. Both judges score everything (for the agreement metric); same-family scores are excluded from ranking to remove LLM self-preference bias.

This bias was measured directly: Sonnet scored Opus **+1.33 points higher** than GPT-5.2 did, with the cross-family judge flagging substantive issues (hallucinated bugs, broken API contracts) that the same-family judge missed.

### [Scoring] Weight presets as product philosophy

| Dimension | Developer Trust | Ship Fast |
|-----------|:-:|:-:|
| Context Utilization | **0.25** | 0.10 |
| Explanation Quality | **0.25** | 0.05 |
| Style Adherence | **0.20** | 0.10 |
| Edge Case Handling | 0.15 | **0.20** |
| Completeness | 0.10 | **0.25** |
| Correctness | 0.05 | **0.30** |

The preset you choose reveals what you believe matters for a coding agent. The tool enables custom scoring as well.

---

## Key Findings

### 1. Codex wins 14 of 16: conservative changes = trust = delegation

**Record:** GPT-5.3 Codex 14, Claude Opus 4.6 2. Average gap: 0.82 points.

| Dimension | Codex Avg | Opus Avg | Gap |
|-----------|:-:|:-:|:-:|
| Context Utilization | 4.88 | 3.56 | +1.31 |
| Correctness | 4.75 | 3.75 | +1.00 |
| Edge Case Handling | 4.25 | 3.31 | +0.94 |
| Completeness | 4.69 | 3.81 | +0.88 |
| Style Adherence | 4.75 | 4.00 | +0.75 |
| Explanation Quality | 4.81 | 4.50 | +0.31 |

Codex wins across all dimensions, but the pattern is telling: the largest gaps are on "trust" dimensions (context, correctness) where conservative, accurate changes matter most. The narrowest gap is explanation quality, Opus's relative strength.

**Product understanding:** Codex's advantage is behavioral, not capability-based. It makes changes that are easy to verify and ship. This is exactly what you want from an agent you delegate to.

### 2. Agent loops fix hallucination (+1.20) but not judgment (+1.05, same flaw)

Three tasks ran in both single-shot and 5-step agent loop mode:

| Task | Claude Single-shot | Claude Agent Loop | Delta |
|------|:-:|:-:|:-:|
| Review Caching Layer PR | 3.55 ([single-shot](outputs/runs/0c4948c4-dbee-45a2-bc94-5aaf04102d04.json)) | 4.75 ([agent loop](outputs/runs/2d97e235-30dc-461c-9435-b5dba144c3aa.json)) | **+1.20** |
| Refactor Callbacks | 2.45 ([single-shot](outputs/runs/10608145-5e70-4077-a417-75fadc66030d.json)) | 3.50 ([agent loop](outputs/runs/5fccd0ae-f8f0-4719-ac07-d7f637e8a491.json)) | **+1.05** |
| Debug Memory Leak | 3.05 ([single-shot](outputs/runs/3c6501c0-9b6f-4562-afd6-eec860f44683.json)) | 3.80 ([agent loop](outputs/runs/3a64f713-bf3f-4bfb-b0bb-90dbf8127069.json)) | **+0.75** |

The Caching PR is the clearest win: in single-shot, Opus hallucinated a bug that didn't exist. The agent loop's review step caught and corrected the hallucination. This is the kind of error that agent loops are designed to fix.

The Refactor task shows a different behavior: Opus broke a public API by renaming a method. The agent loop's 5 steps all built on the same flawed judgment. More steps didn't help because the error was in the *decision/judgement*, not the *execution*.

**Product understanding:** Agent loops should be mandatory for code review (eliminates hallucination) and optional for code generation (judgment errors persist regardless).

### 3. Ship_fast vs developer_trust: same winners, but margins shift

Three tasks ran under both weight presets:

| Task | ship_fast gap | dev_trust gap |
|------|:-:|:-:|
| Off-by-One Bugfix | -0.10 (Claude wins) ([ship_fast](outputs/runs/e3a84e03-5f24-435f-b5cf-57fcd8bcb463.json)) | -1.05 (Claude wins) ([dev_trust](outputs/runs/a4f54b5b-dc75-46d6-aa47-919c427e0304.json)) |
| Optimize DB Query | +0.40 (Codex wins) ([ship_fast](outputs/runs/152589f0-297e-4cca-bd06-06e0aad1d25c.json)) | +0.80 (Codex wins) ([dev_trust](outputs/runs/090a3a64-ca37-4131-b878-bdff8d32fdad.json)) |
| Dark Mode | +0.45 (Codex wins) ([ship_fast](outputs/runs/90c16c1e-803c-4227-a6d3-60a5a905ab46.json)) | +0.75 (Codex wins) ([dev_trust](outputs/runs/e7b91243-801b-45ea-96e5-8abf6a4883eb.json)) |

Winners stayed the same, but the margins changed dramatically. The Off-by-One task gap shrinks from 1.05 to just 0.10 under ship_fast, nearly a tie. This is the task where Claude's explanation quality matters most (root cause analysis of a subtle bug).

**Product understanding:** Weight presets don't just change scores; they change how close the competition is. For tasks where explanation quality matters (debugging, code review), the Codex advantage narrows significantly under ship_fast weights.

### 4. Explanation quality is Opus's moat but insufficient for autonomous agents

Opus scores 4.50/5 on explanation quality (its strongest dimension and the narrowest gap with Codex at +0.31). But explanation quality without correctness is a liability.

The Refactor Callbacks task is the most clear example: Opus scored 4+ on explanation in a run where correctness was 2/5 (it broke a public API) ([run details](outputs/runs/10608145-5e70-4077-a417-75fadc66030d.json)). A developer reading the explanation would *trust* the change, and be wrong.

This points to two product paths:
- **Opus as pair programmer:** Explains what to do, human executes and verifies
- **Codex as delegated agent:** Does it correctly, explanation is secondary

**Product understanding:** For Codex's positioning as "an AI software engineer you delegate to," correctness > explanation. But for a pair programming product, the calculus reverses.

### 5. Same-family bias is real and measurable (+1.33 points)

Sonnet scored Opus +1.33 points higher than GPT-5.2 did on the same responses. The secondary judge's criticisms were substantive: flagging hallucinated bugs, broken API contracts, and incomplete implementations that the same-family judge rated 4-5/5.

Judge agreement rates tell the full story:
- **Ship_fast runs:** 100% agreement (objective dimensions dominate)
- **Developer_trust runs:** 76% agreement (subjective dimensions create divergence)
- **Per-dimension:** Explanation quality 94%, style 84%, correctness 81%, completeness 81%, edge cases 81%, context utilization 62%

**Product read:** Any LLM-as-judge system needs cross-provider validation. A single-judge system from the same family will systematically inflate scores, and the inflation is largest on the dimensions that matter most for trust.

---

## Bet Details and Plan

### Bet 1 Detail: Context moat → productized context visibility

Context utilization is the dimension with the largest gap (4.88 vs 3.56, a 1.31 point lead). Codex already understands existing codebases better than the competition. The bet: make this advantage visible.

**What I'd build:**
- Surface context signals in the UI: "I noticed your project uses Zod for validation, so I used Zod here too"
- Automated codebase understanding: infer conventions from the repo itself, not just AGENTS.md
- Track context utilization as a first-class product metric (not just a model eval dimension)

**Why this wins:** Developers trust agents that understand their code. Making context utilization visible turns a model advantage into a product moat.

### Bet 2 Detail: Task-adaptive agent loops

The data shows agent loops eliminate hallucination in code review (+1.20) but don't fix judgment errors in generation (+1.05, same flaw). The bet: make agent loops adaptive.

**What I'd build:**
- Default to agent loop for code review tasks (where hallucination is the primary risk)
- Default to single-shot for generation tasks (where judgment is the bottleneck, not iteration)
- Trajectory view showing what the agent read, why it chose its approach, what it rejected
- Mid-trajectory intervention: "Yes that approach, but use the existing cache layer"

**Why this wins:** Agent loops are expensive (5x the API calls). Using them selectively based on task type maximizes quality improvement per dollar spent.

### Bet 3 Detail: Trust surface as the core product surface

Codex's conservative approach (making safe, verifiable changes) is the product advantage, not a limitation. The data proves this: Codex wins 14-2 not because it's smarter, but because developers can trust what it did.

**What I'd build:**
- Confidence signals: show the agent's uncertainty alongside its output
- Diff-first UI: show what changed before showing what was generated
- Progressive delegation: start with small tasks, earn trust, unlock larger scope
- Silent refusal detection: surface empty responses with `finish_reason: 'length'` explicitly (the invisible failure mode we discovered)

**Why this wins:** The competitive moat for a coding agent isn't capability; it's trust. Every feature that helps developers verify the agent's work increases the surface area of tasks they're willing to delegate.

---

## First 90 Days

### Days 1–30: Map the Trust Gap

- Run this harness against Codex internal benchmarks. Where do external evals diverge from internal quality metrics?
- Audit user feedback (support tickets, forums, socials). Build a taxonomy using the 6-dimension framework: which dimension failures cause the most churn?
- Interview 5-10 power users. What do they delegate? What don't they trust?

### Days 31–60: Define the Quality Bar

- Establish continuous evaluation (like this harness) for monitoring model quality across releases. Focus on the 6 dimensions, not generic pass/fail benchmarks.
- Define "trust milestones". Example: when context utilization consistently hits 4.5+, market Codex as "codebase-aware."
- Prioritize backlog by mapping user pain to dimensions (largest gaps in user trust should drive the roadmap).

### Days 61–90: Ship an Improvement

- Ship the trajectory view or context visibility feature.
- Establish the feedback loop between product metrics and model training priorities.
- Publish a "State of Codex Quality" report for the team using the 6-dimension framework. What improved, what didn't, what's next.
- Propose Q2 roadmap based on the 3 bets, sequenced by expected impact and engineering feasibility.

---

## Technical Appendix

### Architecture
- **Dual-judge system:** Claude Sonnet 4 (primary) + GPT-5.2 (secondary, cross-validation)
- **Cross-family scoring:** opposite-provider judge determines winner, both score for agreement metric
- **10 coding tasks** spanning bugfix, refactor, greenfield, code review, and performance optimization
- **Weight presets** (Developer Trust vs Ship Fast) that make evaluation philosophy explicit
- **File-based persistence:** JSON files, no database

### Source
The full evaluation harness is open-source. Clone it, run `npm install && npm run dev`, and explore the data behind these findings. [GitHub Link](https://github.com/ashstep2/agent-eval-harness)
