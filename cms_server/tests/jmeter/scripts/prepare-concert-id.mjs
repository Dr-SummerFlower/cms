import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT, getBaseUrl, loadEnvTest } from './env.mjs';

const TEST_CONCERT_NAME = '【测试】示例演唱会';

async function main() {
  const env = loadEnvTest();
  const baseUrl = getBaseUrl(env);

  const res = await fetch(`${baseUrl}/api/concerts?page=1&limit=50`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`获取演唱会列表失败: HTTP ${res.status}`);
  }

  const concerts = body?.data?.concerts ?? [];
  const concert = concerts.find((c) => c?.name === TEST_CONCERT_NAME);

  if (!concert?._id) {
    throw new Error(
      `未找到测试演唱会「${TEST_CONCERT_NAME}」，请先 RUNNING_ENV=test 启动服务并完成种子初始化`,
    );
  }

  const concertId = String(concert._id);
  writeFileSync(
    join(JMETER_ROOT, 'data', 'concert-id.csv'),
    `concertId\n${concertId}\n`,
    'utf8',
  );
  console.log(`已写入 data/concert-id.csv: ${concertId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
