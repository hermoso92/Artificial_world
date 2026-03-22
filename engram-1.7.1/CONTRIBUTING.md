# Contributing to Engram

Thanks for contributing.

## Contribution Flow (Issue First)

Before opening a PR, open an issue to discuss the change:

1. Problem statement (what is broken or missing)
2. Proposed approach (high-level)
3. Risks/tradeoffs
4. Affected areas (API, CLI, TUI, plugins, docs, skills)

After alignment in the issue, open the PR and link it to the issue.

## PR Rules

- Keep PR scope focused (one logical change)
- Include validation evidence (`go test ./...`, targeted tests)
- Update docs in the same PR when behavior changes
- Do not reference endpoints/scripts that do not exist in code
- Use conventional commit messages
- Do not include `Co-Authored-By` trailers in commits

## Skill Authoring Standard

Repository skills live in `skills/`.

Use a **hybrid format**:

1. Structured base (purpose, when to use, critical rules, checklists)
2. Cookbook section (`If / Then / Example`) for repetitive actions

Why hybrid:
- Structured base protects correctness and architecture intent
- Cookbook improves execution consistency for common flows

## Agent Skill Linking

Run:

```bash
./setup.sh
```

This links repo `skills/*` into project-local:
- `.claude/skills/*`
- `.codex/skills/*`
- `.gemini/skills/*`
