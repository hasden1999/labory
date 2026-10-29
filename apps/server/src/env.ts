import fs from 'fs';
import path from 'path';

/**
 * Minimal, dependency-free .env loader for the Fastify server.
 *
 * Next.js loads .env automatically, but the standalone Fastify process does not.
 * Existing process environment variables always win, so a launcher/service can
 * still override anything here. Values are never logged.
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadEnv(): void {
  const candidates = [
    process.env.LABRYO_ENV_FILE,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '..', '.env'),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const parsed = parseEnvFile(fs.readFileSync(file, 'utf8'));
      for (const [key, value] of Object.entries(parsed)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // A missing/unreadable .env must not prevent the server from starting.
    }
    break;
  }
}

loadEnv();
