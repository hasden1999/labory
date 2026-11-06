import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

export default {
  targets: [
    {
      engine: web(),
      app: {
        url: 'http://127.0.0.1:3000',
        command: { executable: 'npm', args: ['run', 'dev:web'], log: '.e2e/logs/app.log' },
      },
    },
  ],
  tests: 'tests/e2e-specs/**/*.e2e.ts',
  timeout: 60_000,
} satisfies E2EConfig;
