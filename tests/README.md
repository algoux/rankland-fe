# Tests

This directory contains the project's automated tests and shared test assets.

## Structure

- `unit/`: utility and service unit tests
- `e2e/`: Playwright browser tests
- `ssr/`: SSR smoke tests against built output
- `fixtures/`: mock payloads shared by E2E and SSR tests
- `setup/`: shared Vitest setup
- `shims/`: test-only module shims

## UI test selector conventions

For browser/UI tests, prefer stable structural selectors over visible copy.

Selector priority:

1. `data-id`
2. Stable `class`, `href`, or DOM structure
3. Visible text only when there is no stable alternative

Avoid `getByText`, `hasText`, or other assertions that bind tests to page copy when a structural hook is available.

`toHaveTitle` and other document-level assertions are acceptable when the title itself is the behavior under test.

## `data-id` conventions

When a page needs an explicit test hook, use `data-id` rather than `data-testid`.

Guidelines:

- Use business-facing names, not test jargon
- Prefer `page-section-item` style names such as `search-result-section` or `ranklist-not-found`
- Put hooks on stable page-level nodes like containers, empty states, error states, navigation items, and result items
- Keep hooks minimal; do not scatter them across purely visual wrapper nodes

## When source changes are acceptable

If an existing page does not expose a stable selector, it is acceptable to add a small `data-id` hook in source code for testing.

Prefer adding hooks to:

- page containers
- empty states
- error states
- result rows/items
- stable navigation nodes

Avoid adding hooks to transient implementation details unless that detail is the behavior being tested.
