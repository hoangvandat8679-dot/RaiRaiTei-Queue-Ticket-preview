# PROJECT_STATUS.md

## Project
RaiRaiTei Queue Ticket Generator

## Environment
- DEVELOPMENT: `hoangvandat8679-dot/RaiRaiTei-Queue-Ticket-preview`
- PRODUCTION/STABLE: `hoangvandat8679-dot/RaiRaiTei-Queue-Ticket`
- Development default branch: `main`
- Production changes require Project Owner release approval.

## Governance
- Project Owner: Hoang Van Dat
- Leader / Architect / Final QA: ChatGPT
- Builder: Codex and/or Cursor, selected per task
- E2E / Browser QA: Antigravity
- Local Inspector / Context Compressor / Regression: Qwen2.5-Coder 7B Instruct on Bionic

## Master Invariant
Ticket master canvas: **723 × 1240 px**. See `MASTER_SPEC.md`.

## Working Model
Do not invoke every agent for every task.

Typical routing:
- Small code bug: Leader → Builder → Qwen regression → Leader
- Mobile/print bug: Antigravity reproduce → Builder fix → Qwen regression → Antigravity retest → Leader
- Cleanup/refactor: Qwen scan → Builder change → Qwen regression → Leader
- Large feature: Qwen Context Pack → Builder → Qwen regression → Antigravity E2E → Leader
- Release candidate: Qwen full regression → Antigravity critical E2E → Leader Final QA → Project Owner release decision

## Token Policy
Use local compute for high-context/high-repetition work whenever practical.

Qwen Local should preferentially handle:
- repository-wide scans
- repeated searches
- dependency tracing
- static checks
- regression runs
- diff inspection
- dead/duplicate-code candidates
- Context Pack preparation

Cloud agents should receive the smallest sufficient context: task + rules + relevant files/diff + evidence.

## Branch / Review Policy
- Do not use production repository as a development workspace.
- Prefer task branches for implementation work.
- Review Git diff/PR rather than retransmitting full unchanged files.
- P0/P1 failures block Final Approval.
- Only Leader may issue `FINAL APPROVED` after required QA gates.
- Project Owner decides when an approved development state is released to production.

## Current Status
Agent governance bootstrap is being established on branch `setup/agent-governance`.
The repository currently contains the preview deployment workflow; project source/deployment population should be verified before assigning implementation tasks.