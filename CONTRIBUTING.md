# Contributing to SAACGAIS

---

## Branching & Workflow
main
└── development
└── your-feature-branch
| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, protected |
| `development` | Integration branch — all work merges here first |
| `<feature-branch>` | Your working branch |

**The flow is always:**
feature-branch → development → main
1. Branch off `development` for all new work
2. Name branches descriptively: `#[issue]-csrf-timing`, `#[issue]-patient-chat`, `#[issue]-readme`
3. Open a PR into **`development`** when your work is ready for review
4. Once `development` is stable and reviewed, a team member will open a PR from **`development`** into **`main`**
5. No rebasing on shared branches — use merge commits

---

## Getting Started

See [README.md](./README.md) for full setup instructions including AWS, Supabase, and environment variables.

---

## Code Standards

All code must:
- Compile and run without errors
- Include comments on non-trivial logic
- Not include hardcoded secrets — use environment variables

**Frontend:** API calls belong in `api.js` service functions, not directly in components. Use Material UI — do not introduce new UI libraries.

**Backend:** All authenticated routes go through `authenticate` middleware. All mutating routes pass `csrfCheck`. Input validation uses `express-validator`. Database access goes through `supabaseService.js` — no direct Supabase calls in route files.

---

## Pull Requests

Use the PR template. Every PR requires:
- A one-sentence summary of what changed and why
- Related issue number(s)
- Completed security impact section
- No unresolved comments

---

## Testing

```bash
cd app/server && npm test
cd app/client && npm test
```

New functionality should include or update existing tests. Changes to auth, CSRF, or the agent pipeline are expected to have test coverage.

---

## Security

- Never bypass `authenticate` or `csrfCheck` except on intentionally public routes
- Any change touching auth, CSRF, or the AI agent pipeline must include a completed security section in the PR
- Report vulnerabilities directly to maintainers — do not open public issues

---

## Issues

File issues at [GitHub Issues](https://github.com/SAACGAIS-Team/SAACGAIS/issues). Include a clear title, steps to reproduce for bugs, and any relevant error messages or logs.