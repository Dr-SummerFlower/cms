import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT } from './env.mjs';

/** 1x1 PNG，用于购票 multipart 上传 */
const MINI_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const FACE_COPY_COUNT = Math.max(
  1,
  Number(
    process.env.PERF_FACE_SAMPLE_COUNT ||
      process.env.PERF_PURCHASE_USER_COUNT ||
      process.env.PERF_PURCHASE_THREADS ||
      50,
  ),
);

const assetsDir = join(JMETER_ROOT, 'assets');
mkdirSync(assetsDir, { recursive: true });

const png = Buffer.from(MINI_PNG_BASE64, 'base64');
writeFileSync(join(assetsDir, 'face-sample.png'), png);

for (let i = 1; i <= FACE_COPY_COUNT; i++) {
  writeFileSync(join(assetsDir, `face-sample-${i}.png`), png);
}

console.log(
  `已生成 assets/face-sample.png 与 face-sample-1～${FACE_COPY_COUNT}.png（避免 Windows 多线程共享受阻）`,
);
