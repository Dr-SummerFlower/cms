import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT, getBaseUrl, loadEnvTest, parseCsvLine, readConcertId } from './env.mjs';

const DEFAULT_QR_COUNT = 10;
const LOCATION = '测试检票口A';

/**
 * @param {string} csvPath
 * @returns {Array<{ email: string; access_token: string; user_index: string }>}
 */
function readUserTokens(csvPath) {
  const lines = readFileSync(csvPath, 'utf8').trim().split('\n');
  const rows = lines.slice(1).map((line) => {
    const [email, access_token, user_index] = parseCsvLine(line.trim());
    return { email, access_token, user_index };
  });
  return rows.filter((r) => r.access_token && r.email);
}

/**
 * @param {number} userIndex
 * @returns {string}
 */
function formatIdCard(userIndex) {
  const suffix = String(userIndex).padStart(4, '0');
  return `11010119900101${suffix}`;
}

/**
 * @param {string} baseUrl
 * @param {string} token
 * @param {string} concertId
 * @param {string} userIndex
 * @returns {Promise<string>}
 */
async function purchaseOneTicket(baseUrl, token, concertId, userIndex) {
  const facePath = join(JMETER_ROOT, 'assets', 'face-sample.png');
  const order = {
    concertId,
    tickets: [
      {
        type: 'adult',
        quantity: 1,
        attendees: [
          {
            realName: `测试用户${userIndex}`,
            idCard: formatIdCard(Number(userIndex)),
          },
        ],
      },
    ],
  };

  const form = new FormData();
  form.append('data', JSON.stringify(order));
  form.append('faceImages', new File([readFileSync(facePath)], 'face-sample.png', {
    type: 'image/png',
  }));

  const res = await fetch(`${baseUrl}/api/tickets/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(
      `购票失败 user_index=${userIndex}: HTTP ${res.status} - ${body?.message ?? JSON.stringify(body)}`,
    );
  }

  const tickets = body?.data;
  const ticketId = Array.isArray(tickets) ? tickets[0]?._id : tickets?._id;
  if (!ticketId) {
    throw new Error(`购票响应缺少票据 ID: user_index=${userIndex}`);
  }
  return String(ticketId);
}

async function main() {
  const env = loadEnvTest();
  const baseUrl = getBaseUrl(env);
  const count = Number(process.env.PERF_QR_COUNT || DEFAULT_QR_COUNT);

  const concertId = readConcertId(join(JMETER_ROOT, 'data', 'concert-id.csv'));
  const users = readUserTokens(join(JMETER_ROOT, 'data', 'user-tokens.csv'));

  if (users.length < count) {
    throw new Error(`user-tokens.csv 仅 ${users.length} 条，无法生成 ${count} 个二维码`);
  }

  const rows = [['ticketId', 'holder_token', 'location']];

  const offset = Math.max(0, users.length - count);
  console.log(
    `为验票场景预购 ${count} 张票（user-tokens 第 ${offset + 1}～${offset + count} 行；验票时将实时拉取 QR）…`,
  );
  for (let i = 0; i < count; i++) {
    const user = users[offset + i];
    const ticketId = await purchaseOneTicket(
      baseUrl,
      user.access_token,
      concertId,
      user.user_index,
    );
    rows.push([ticketId, user.access_token, LOCATION]);
    console.log(`  [${i + 1}/${count}] ticket=${ticketId}`);
  }

  const outPath = join(JMETER_ROOT, 'data', 'qr-codes.csv');
  const content = `${rows
    .map((r, idx) =>
      idx === 0 ? r.join(',') : `${r[0]},"${r[1]}",${r[2]}`,
    )
    .join('\n')}\n`;

  writeFileSync(outPath, content, 'utf8');
  console.log('已写入 data/qr-codes.csv（列: ticketId, holder_token, location）');

  const firstLine = content.trim().split('\n')[0];
  if (firstLine.includes('signature') || firstLine.includes('timestamp')) {
    throw new Error(
      'qr-codes.csv 表头异常，请确认 prepare-qr-codes.mjs 为最新版本后重试',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
