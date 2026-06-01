import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const JMETER_ROOT = join(__dirname, '..');
export const CMS_ROOT = join(JMETER_ROOT, '..', '..');

/**
 * 解析 JMeter 可执行文件路径，优先使用 JMETER_HOME 环境变量。
 *
 * @returns {string}
 */
export function resolveJmeterBin() {
  const home = process.env.JMETER_HOME;
  if (home) {
    const bin =
      platform() === 'win32'
        ? join(home, 'bin', 'jmeter.bat')
        : join(home, 'bin', 'jmeter');
    if (existsSync(bin)) return bin;
  }

  if (platform() === 'win32') {
    const where = spawnSync('where.exe', ['jmeter.bat'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (where.status === 0 && where.stdout?.trim()) {
      return where.stdout.trim().split(/\r?\n/)[0].trim();
    }
    return 'jmeter.bat';
  }

  return 'jmeter';
}

/**
 * 从 data/concert-id.csv 读取演唱会 ID（第二行）。
 *
 * @param {string} [filePath]
 * @returns {string}
 */
export function readConcertId(filePath) {
  const path = filePath ?? join(JMETER_ROOT, 'data', 'concert-id.csv');
  if (!existsSync(path)) {
    throw new Error('缺少 data/concert-id.csv，请先运行 npm run perf:prepare:concert');
  }
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  if (lines.length < 2) {
    throw new Error('concert-id.csv 无效，请先运行 perf:prepare:concert');
  }
  return lines[1].trim();
}

/**
 * 从 .env.test 解析键值（不依赖 dotenv）。
 *
 * @param {string} [envFile]
 * @returns {Record<string, string>}
 */
export function loadEnvTest(envFile = '.env.test') {
  const path = join(CMS_ROOT, envFile);
  const content = readFileSync(path, 'utf8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

/**
 * @param {Record<string, string>} env
 * @returns {string}
 */
export function getBaseUrl(env) {
  const port = env.PORT || '25551';
  return process.env.PERF_BASE_URL || env.PERF_BASE_URL || `http://localhost:${port}`;
}

/**
 * @param {string} redisUri
 * @returns {{ host: string; port: number }}
 */
export function parseRedisUri(redisUri) {
  const url = new URL(redisUri);
  return {
    host: url.hostname || 'localhost',
    port: Number(url.port || 6379),
  };
}

/**
 * @param {string} baseUrl
 * @returns {{ protocol: string; host: string; port: string }}
 */
export function parseBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  return {
    protocol: url.protocol.replace(':', ''),
    host: url.hostname,
    port: url.port || (url.protocol === 'https:' ? '443' : '80'),
  };
}

/**
 * 解析含引号字段的 CSV 行（用于读取 user-tokens.csv）。
 *
 * @param {string} line
 * @returns {string[]}
 */
export function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}
