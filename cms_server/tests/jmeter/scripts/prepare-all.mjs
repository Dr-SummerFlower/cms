import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} script
 */
function run(script) {
  console.log(`\n>>> node scripts/${script}`);
  const result = spawnSync(process.execPath, [join(__dirname, script)], {
    stdio: 'inherit',
    cwd: join(__dirname, '..'),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  '提示: 预备 Token 后请尽快执行压测；访问令牌默认 15 分钟过期（见 .env.test 中 JWT_ACCESS_EXPIRES_IN）。\n',
);
run('create-face-sample.mjs');
run('prepare-tokens.mjs');
run('prepare-concert-id.mjs');
run('prepare-purchase-users.mjs');
run('prepare-qr-codes.mjs');
console.log('\n预备数据完成。');
