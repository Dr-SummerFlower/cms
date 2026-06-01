import { createClient } from 'redis';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT, getBaseUrl, loadEnvTest, parseRedisUri } from './env.mjs';

const TEST_EMAIL_DOMAIN = '@test.local';
const TEST_USER_PASSWORD = 'Test@123456';
const TEST_REGULAR_USER_COUNT = Number(process.env.PERF_USER_COUNT || 200);
const TEST_INSPECTOR_COUNT = 2;

/**
 * @param {number} index
 * @returns {string}
 */
function formatTestUserEmail(index) {
  const username = `testuser${String(index).padStart(3, '0')}`;
  return `${username}${TEST_EMAIL_DOMAIN}`;
}

/**
 * @param {number} index
 * @returns {string}
 */
function formatInspectorEmail(index) {
  const username = `testinspector${String(index).padStart(2, '0')}`;
  return `${username}${TEST_EMAIL_DOMAIN}`;
}

/**
 * @param {string} baseUrl
 * @returns {Promise<string>}
 */
async function fetchCaptchaId(baseUrl) {
  const res = await fetch(`${baseUrl}/api/auth/captcha`);
  if (!res.ok) {
    throw new Error(`获取验证码失败: HTTP ${res.status}`);
  }
  const captchaId = res.headers.get('x-captcha-id');
  if (!captchaId) {
    throw new Error('响应缺少 X-Captcha-Id 头');
  }
  return captchaId;
}

/**
 * @param {import('redis').RedisClientType} redis
 * @param {string} captchaId
 * @returns {Promise<string>}
 */
async function readCaptchaFromRedis(redis, captchaId) {
  const code = await redis.get(`captcha:${captchaId}`);
  if (!code) {
    throw new Error(`Redis 中未找到验证码 captcha:${captchaId}`);
  }
  return code;
}

/**
 * @param {string} baseUrl
 * @param {string} email
 * @param {string} password
 * @param {string} captchaId
 * @param {string} captchaCode
 * @returns {Promise<string>}
 */
async function login(baseUrl, email, password, captchaId, captchaCode) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      captchaId,
      captchaCode,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(
      `登录失败 ${email}: HTTP ${res.status} - ${body?.message ?? JSON.stringify(body)}`,
    );
  }

  const token = body?.data?.access_token;
  if (!token) {
    throw new Error(`登录响应缺少 access_token: ${email}`);
  }

  const payloadPart = token.split('.')[1];
  if (payloadPart) {
    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf8'),
    );
    const expiresAt = new Date(payload.exp * 1000);
    const minutesLeft = Math.round((expiresAt.getTime() - Date.now()) / 60000);
    if (minutesLeft < 60) {
      console.warn(
        `  警告: ${email} 的 Token 约 ${minutesLeft} 分钟后过期。请在 .env.test 设置 JWT_ACCESS_EXPIRES_IN=1d 并重启服务后重新 perf:prepare:tokens`,
      );
    }
  }

  return token;
}

/**
 * @param {string} email
 * @param {string} password
 * @param {string} baseUrl
 * @param {import('redis').RedisClientType} redis
 * @returns {Promise<string>}
 */
async function loginWithCaptcha(email, password, baseUrl, redis) {
  const captchaId = await fetchCaptchaId(baseUrl);
  const captchaCode = await readCaptchaFromRedis(redis, captchaId);
  return login(baseUrl, email, password, captchaId, captchaCode);
}

async function main() {
  const env = loadEnvTest();
  const baseUrl = getBaseUrl(env);
  const { host, port } = parseRedisUri(env.REDIS_URI || 'redis://localhost:6379');

  const redis = createClient({
    socket: { host, port },
    password: env.REDIS_PWD || undefined,
  });
  await redis.connect();

  const dataDir = join(JMETER_ROOT, 'data');
  const userRows = [['email', 'access_token', 'user_index']];
  const inspectorRows = [['email', 'access_token']];

  console.log(`预备用户 Token（${TEST_REGULAR_USER_COUNT} 个）…`);
  for (let i = 1; i <= TEST_REGULAR_USER_COUNT; i++) {
    const email = formatTestUserEmail(i);
    const token = await loginWithCaptcha(
      email,
      TEST_USER_PASSWORD,
      baseUrl,
      redis,
    );
    userRows.push([email, token, String(i).padStart(4, '0')]);
    console.log(`  [${i}/${TEST_REGULAR_USER_COUNT}] ${email}`);
  }

  console.log(`预备验票员 Token（${TEST_INSPECTOR_COUNT} 个）…`);
  for (let i = 1; i <= TEST_INSPECTOR_COUNT; i++) {
    const email = formatInspectorEmail(i);
    const token = await loginWithCaptcha(
      email,
      TEST_USER_PASSWORD,
      baseUrl,
      redis,
    );
    inspectorRows.push([email, token]);
    console.log(`  ${email}`);
  }

  await redis.quit();

  const toCsvLine = (cells) =>
    cells
      .map((cell, idx) => (idx === 1 ? `"${cell}"` : cell))
      .join(',');

  writeFileSync(
    join(dataDir, 'user-tokens.csv'),
    `${userRows.map((r) => toCsvLine(r)).join('\n')}\n`,
    'utf8',
  );
  writeFileSync(
    join(dataDir, 'inspector-tokens.csv'),
    `${inspectorRows.map((r) => toCsvLine(r)).join('\n')}\n`,
    'utf8',
  );

  console.log('已写入 data/user-tokens.csv 与 data/inspector-tokens.csv');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
