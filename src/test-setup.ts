/**
 * Vitest setup.
 *
 * React Native testing (react-test-renderer) does not need a DOM, and the
 * app's unit tests (domain validation, auth service) run in a plain Node
 * environment. The App.test.tsx smoke tests use react-test-renderer, which
 * does not need jsdom. No mocking or setup is required for the current
 * test suite.
 *
 * __DEV__ is a global provided by Metro at runtime. In vitest/jsdom it is not
 * defined, so we set it here for tests that exercise dev-only components
 * (e.g. DevMockLogin). Tests can override `globalThis.__DEV__` per test file.
 */
Object.defineProperty(globalThis, '__DEV__', {
  writable: true,
  configurable: true,
  value: process.env.NODE_ENV !== 'production',
});

