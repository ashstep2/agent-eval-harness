# Product Direction: What Agent Builders Need from the API

## TLDR

What the eval data says about what's missing in today's agent APIs/SDKs.

## Three Gaps

### 1. Verification is left to the builder
Agents fail silently. In tau-bench, baseline agents reported "success" on 22% of actions that actually failed. My VerifyingAccessAgent caught these with post-action confirmation calls — but every builder is reimplementing this from scratch.

**API primitive:** Tool-call verification hooks. Let builders define post-action checks in the SDK, not in custom middleware.

### 2. Developers can't evaluate their agents
Cross-family judging shifted rankings on 3 of 10 tasks. Same-family scoring inflates by +1.33 points. Builders using a single LLM to judge their agent's output are getting wrong answers about quality.

**API primitive:** An evaluation helper in the SDK — configurable dimensions, weight presets that encode product philosophy, cross-provider scoring by default.

### 3. One-size-fits-all orchestration wastes money
Agent loops improved hallucination by +1.20 on review tasks but didn't fix judgment errors on generation tasks. 5x the API calls for the same flawed output.

**API primitive:** Conditional orchestration — loop when verification matters, single-shot when judgment is the bottleneck. Make this a SDK-level decision, not an afterthought.

## 90-Day Plan

**Month 1:** Map what agent builders are hacking around. Where do they build custom infra that should be in the SDK? (Developer interviews + API usage pattern analysis.)

**Month 2:** Ship one primitive (verification hooks or eval helper). Measure adoption and iteration velocity.

**Month 3:** Define the agent SDK roadmap from usage data. Publish internal "State of Agent Builders" report.
