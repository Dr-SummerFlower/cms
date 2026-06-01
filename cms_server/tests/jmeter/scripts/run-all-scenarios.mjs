import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarios = ['browse', 'purchase', 'my-tickets', 'verify'];

for (const name of scenarios) {
  const result = spawnSync(
    process.execPath,
    [join(__dirname, 'run-jmeter.mjs'), name],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n全部场景执行完成。');
