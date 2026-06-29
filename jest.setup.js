require('@testing-library/jest-dom');

// Mock Vite's import.meta.env for Jest environment
global.import = {
  meta: {
    env: {
      VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || 'test-key',
    },
  },
};
