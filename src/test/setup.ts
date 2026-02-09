import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Моки для глобальных объектов
global.fetch = vi.fn();
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
