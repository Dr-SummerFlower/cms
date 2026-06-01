import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT, getBaseUrl, loadEnvTest, parseCsvLine, readConcertId } from './env.mjs';

const DEFAULT_PURCHASE_USER_COUNT = 50;
const DEFAULT_QR_COUNT = 10;
const DEFAULT_MAX_ADULT_TICKETS_PER_USER = 5;
const DEFAULT_FACE_SAMPLE_COUNT = 50;

/**
 * @param {string} csvPath
 * @returns {Array<{ email: string; access_token: string; user_index: string }>}
 */
function readAllUserTokens(csvPath) {
  const lines = readFileSync(csvPath, 'utf8').trim().split('\n');
  return lines.slice(1).map((line) => {
    const [email, access_token, user_index] = parseCsvLine(line.trim());
    return { email, access_token, user_index };
  });
}

/**
 * @param {string} baseUrl
 * @param {string} token
 * @param {string} concertId
 * @returns {Promise<number>}
 */
async function countAdultTicketsForConcert(baseUrl, token, concertId) {
  const res = await fetch(`${baseUrl}/api/tickets/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`查询票夹失败: HTTP ${res.status} - ${body?.message ?? ''}`);
  }

  const tickets = Array.isArray(body?.data) ? body.data : [];
  return tickets.filter(
    (t) =>
      String(t.concert?._id ?? t.concert) === concertId &&
      t.type === 'adult' &&
      ['valid', 'pending', 'used'].includes(t.status),
  ).length;
}

async function main() {
  const env = loadEnvTest();
  const baseUrl = getBaseUrl(env);
  const src = join(JMETER_ROOT, 'data', 'user-tokens.csv');
  const concertId = readConcertId(join(JMETER_ROOT, 'data', 'concert-id.csv'));
  const users = readAllUserTokens(src);

  const purchaseUserCount = Number(
    process.env.PERF_PURCHASE_USER_COUNT || DEFAULT_PURCHASE_USER_COUNT,
  );
  const maxAdultTicketsPerUser = Number(
    process.env.PERF_MAX_ADULT_TICKETS_PER_USER ||
    DEFAULT_MAX_ADULT_TICKETS_PER_USER,
  );
  const faceSampleCount = Math.max(
    1,
    Number(
      process.env.PERF_FACE_SAMPLE_COUNT ||
      process.env.PERF_PURCHASE_USER_COUNT ||
      DEFAULT_FACE_SAMPLE_COUNT,
    ),
  );
  const qrCount = Number(process.env.PERF_QR_COUNT || DEFAULT_QR_COUNT);
  const reserved = new Set(
    users.slice(Math.max(0, users.length - qrCount)).map((u) => u.user_index),
  );

  const candidates = users
    .filter((u) => !reserved.has(u.user_index))
    .sort((a, b) => Number(a.user_index) - Number(b.user_index));

  const selected = [];
  for (const user of candidates) {
    if (selected.length >= purchaseUserCount) {
      break;
    }
    const existing = await countAdultTicketsForConcert(
      baseUrl,
      user.access_token,
      concertId,
    );
    if (existing >= maxAdultTicketsPerUser) {
      console.log(
        `  跳过 ${user.email}（本场已有 ${existing} 张成人票，已达到上限 ${maxAdultTicketsPerUser}）`,
      );
      continue;
    }
    selected.push(user);
  }

  if (selected.length < purchaseUserCount) {
    throw new Error(
      `可用购票账号不足 ${purchaseUserCount} 个（仅找到 ${selected.length} 个未达上限的用户）。请清空测试库后重新 start:test，再执行 perf:prepare`,
    );
  }

  const rows = [
    'email,access_token,user_index,face_file',
    ...selected.map(
      (u, i) =>
        `${u.email},"${u.access_token}",${u.user_index},face-sample-${(i % faceSampleCount) + 1}.png`,
    ),
  ];

  writeFileSync(
    join(JMETER_ROOT, 'data', 'purchase-users.csv'),
    `${rows.join('\n')}\n`,
    'utf8',
  );

  console.log(
    `已写入 data/purchase-users.csv（${selected.length} 人，index ${selected[0].user_index}～${selected[selected.length - 1].user_index}）`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
