import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 70,
          functions: 85,
          lines: 80,
          statements: 80,
        },
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.*',
        '**/test/**',
        '**/wrangler.jsonc',
        '**/vitest.config.*',
        '**/*.d.ts'
      ],
      include: [
        'src/**/*.ts',
        'app/**/*.ts'
      ]
    },
    include: [
      'test/**/*.test.ts',
    ],
    setupFiles: ['test/setup.ts'],
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});