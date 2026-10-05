---
name: smart-campus-maintenance
description: "Use when working on the Smart Campus project: debugging the FastAPI backend, fixing frontend pages, running or authoring tests, checking auth, grades, payments, course routes, seed data, or troubleshooting a bug in this repository."
---

# Smart Campus maintenance

## Scope

This repository combines a FastAPI backend in the backend folder and a React/Vite frontend in the root app files and pages/ folder. Load this skill when the task is specific to this project rather than a generic programming question.

## Project map

- Backend entry point: backend/main.py
- API routes: backend/routes/\*.py
- Data and auth: backend/database.py, backend/models.py, backend/security.py, backend/config.py
- Business logic: backend/services/\*.py
- Frontend shell: App.jsx, src/main.jsx, pages/\*.jsx, components/
- Tests: tests/\*.py
- Docs: README.md, PRD.md, design_guidelines.json

## Working rules

- Keep changes focused on the relevant backend or frontend area.
- Prefer the existing architecture instead of creating new abstractions for small fixes.
- Preserve the current JSON API conventions and FastAPI error handling patterns.
- Validate with the smallest relevant command before concluding a fix.
- Avoid unrelated dependency churn or broad refactors when debugging one issue.

## Verification flow

1. Reproduce the issue or inspect the failing symptom.
2. Identify the exact module involved: backend route, service, database access, or frontend page.
3. Apply the smallest fix that addresses the root cause.
4. Run the relevant check:
   - `pytest` for backend/test regressions
   - `npm run build` only when frontend compilation may be affected
   - project-local runtime checks when API behavior needs confirmation
5. Report the result with the command used and the observed outcome.

## Good triggers for this skill

- "Debug the auth flow in this app."
- "Fix the grades API response format."
- "Why does the payment route fail validation?"
- "Add a test for the Smart Campus backend bug."
- "Check the frontend page that loads course data."

## Preferred commands

- `pytest`
- `pytest tests/test_backend_modules.py`
- `pytest tests/test_auth_roles.py`
- `pytest tests/test_api_error_format.py`
- `npm run build`

## Notes

When in doubt, inspect the existing route, model, and test patterns before changing behavior. This project appears to use FastAPI with seeded data and a Vite-based frontend, so maintain compatibility between the backend contract and the UI expectations.
