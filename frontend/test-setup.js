import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Vitest doesn't expose jest-style globals by default, so Testing
// Library's auto-cleanup (which looks for a global afterEach) never
// registers. Do it explicitly so each test starts from an empty DOM.
afterEach(() => {
  cleanup();
});
