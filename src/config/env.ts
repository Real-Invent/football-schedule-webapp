// Note: This function uses process.env which is populated via:
// - vite.config.ts for browser builds (Vite replaces import.meta.env at build time)
// - process.env directly in tests
export function getGeminiApiKey(): string | undefined {
  return process.env.VITE_GEMINI_API_KEY;
}
