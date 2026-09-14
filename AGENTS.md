# AGENTS.md

## Authority
- Project Owner: Hoang Van Dat.
- ChatGPT Leader is the task router, architecture reviewer, and final QA authority.
- Only the Leader may declare `FINAL APPROVED`.
- Agents must not approve their own work as production-ready.

## Repository Role
- This repository (`RaiRaiTei-Queue-Ticket-preview`) is DEVELOPMENT.
- `RaiRaiTei-Queue-Ticket` is PRODUCTION/STABLE and must not be modified as part of development tasks unless the Project Owner explicitly approves a release.

## Mandatory Rules
1. Read this file before starting a task.
2. Read `MASTER_SPEC.md` whenever the task can affect ticket layout, templates, rendering, responsive behavior, or printing.
3. Preserve existing behavior outside the assigned task scope.
4. Modify any files genuinely required by the task, but do not make unrelated changes.
5. Do not add unnecessary text, comments, dependencies, files, or abstractions.
6. Remove dead/duplicate code only when evidence shows removal is safe.
7. Mobile and Print are critical regression areas.
8. Every code change requires regression consideration.
9. If instructions conflict, `MASTER_SPEC.md` and the current Leader task override older prompts, screenshots, comments, and agent suggestions.
10. If evidence is insufficient, report `UNCONFIRMED`; never guess.

## Agent Roles
### Codex / Cursor — Builder
- Implement features and fixes.
- Find root cause before changing code.
- May modify multiple related files when necessary.
- Avoid unrelated refactors.

### Antigravity — E2E / Browser QA
- Prefer test/reproduce/report.
- Try to break user workflows.
- Focus on real browser behavior, responsive UI, mobile, printing, reload/state, and edge cases.
- Do not redesign or modify code unless explicitly assigned.

### Qwen Local / Bionic — Local Inspector + Context Compressor
- Prefer repository-wide reading, search, static analysis, test execution, diff inspection, regression, dead-code candidates, duplicate detection, and dependency tracing.
- Default permission: READ + TEST + REPORT.
- Do not mass-delete, redesign, change architecture, change dependencies, or modify Master Spec.
- Compress large repository findings into a minimal evidence-based Context Pack for cloud agents.

## Evidence Rule
Every reported issue should contain, when applicable:
- FILE
- LOCATION
- EVIDENCE
- EXPECTED
- ACTUAL
- SEVERITY

If not proven, use `UNCONFIRMED`.

## Required Agent Output
Keep reports short. Do not repeat source code or explain unchanged files.

```text
STATUS: PASS | FAIL | BLOCKED
TASK: <id>
CHANGED: <files or NONE>
EVIDENCE: <minimal evidence>
TEST: <pass/fail summary>
RISKS: <remaining risks or NONE>
NEXT: <recommended next action or NONE>
```

## Release Gate
P0/P1 defects block approval. Examples include:
- wrong master ticket ratio/dimensions
- ticket crop/stretch
- broken print output or unexpected blank/extra pages
- wrong waiting number/template
- critical mobile layout failure
- primary workflow unavailable

No agent may merge or release to production solely on its own assessment.