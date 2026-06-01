import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import {
  JMETER_ROOT,
  getBaseUrl,
  loadEnvTest,
  parseBaseUrl,
  readConcertId,
  resolveJmeterBin,
} from './env.mjs';

const SCENARIOS = {
  browse: {
    jmx: 'scenario-browse.jmx',
    jtl: 'browse.jtl',
    report: 'browse',
  },
  purchase: {
    jmx: 'scenario-purchase.jmx',
    jtl: 'purchase.jtl',
    report: 'purchase',
  },
  'my-tickets': {
    jmx: 'scenario-my-tickets.jmx',
    jtl: 'my-tickets.jtl',
    report: 'my-tickets',
  },
  verify: {
    jmx: 'scenario-verify.jmx',
    jtl: 'verify.jtl',
    report: 'verify',
  },
};

/**
 * @param {string} resultsDir
 * @param {string} htmlReportRoot
 */
function ensureWritableResultsDirs(resultsDir, htmlReportRoot) {
  mkdirSync(resultsDir, { recursive: true });
  mkdirSync(htmlReportRoot, { recursive: true });

  const probe = join(htmlReportRoot, '.write-probe');
  try {
    writeFileSync(probe, 'ok', 'utf8');
    rmSync(probe, { force: true });
  } catch {
    throw new Error(
      `无法写入 ${htmlReportRoot}，请检查目录权限或是否被其他程序占用`,
    );
  }
}

/**
 * @param {string} bin
 * @param {string[]} args
 * @param {string} cwd
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runJmeter(bin, args, cwd) {
  return spawnSync(bin, args, {
    stdio: 'inherit',
    cwd,
    env: process.env,
    shell: platform() === 'win32',
  });
}

/**
 * @param {string} scenarioKey
 */
function runScenario(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    console.error(`未知场景: ${scenarioKey}`);
    console.error(`可选: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  const env = loadEnvTest();
  const baseUrl = getBaseUrl(env);
  const { protocol, host, port } = parseBaseUrl(baseUrl);
  const concertId = readConcertId();

  const resultsDir = resolve(JMETER_ROOT, 'results');
  const htmlReportRoot = join(resultsDir, 'html-report');
  const reportDir = resolve(htmlReportRoot, scenario.report);
  const jtlPath = resolve(resultsDir, scenario.jtl);
  const jmxPath = resolve(JMETER_ROOT, 'plans', scenario.jmx);

  if (!existsSync(jmxPath)) {
    throw new Error(`缺少 ${scenario.jmx}，请先运行 npm run perf:generate-jmx`);
  }

  ensureWritableResultsDirs(resultsDir, htmlReportRoot);

  if (existsSync(reportDir)) {
    rmSync(reportDir, { recursive: true, force: true });
  }

  if (existsSync(jtlPath)) {
    rmSync(jtlPath, { force: true });
  }

  const dataDir = resolve(JMETER_ROOT, 'data').replace(/\\/g, '/');
  const assetsDir = resolve(JMETER_ROOT, 'assets').replace(/\\/g, '/');
  const jtlForJmeter = jtlPath.replace(/\\/g, '/');
  const reportForJmeter = reportDir.replace(/\\/g, '/');
  const jmxForJmeter = jmxPath.replace(/\\/g, '/');

  const jmeterBin = resolveJmeterBin();
  const args = [
    '-n',
    '-f',
    '-t',
    jmxForJmeter,
    `-JBASE_HOST=${host}`,
    `-JBASE_PORT=${port}`,
    `-JBASE_PROTOCOL=${protocol}`,
    `-JDATA_DIR=${dataDir}`,
    `-JASSETS_DIR=${assetsDir}`,
    `-JCONCERT_ID=${concertId}`,
    '-l',
    jtlForJmeter,
    '-e',
    '-o',
    reportForJmeter,
  ];

  if (scenarioKey === 'purchase' && process.env.PERF_PURCHASE_THREADS) {
    args.push(`-JPURCHASE_THREADS=${process.env.PERF_PURCHASE_THREADS}`);
  }

  console.log(`运行 JMeter 场景: ${scenarioKey}`);
  console.log(`  JMX: ${jmxPath}`);
  console.log(`  JTL: ${jtlPath}`);
  console.log(`  报告: ${reportDir}\\index.html`);

  const result = runJmeter(jmeterBin, args, JMETER_ROOT);

  const indexHtml = join(reportDir, 'index.html');
  if (result.status !== 0 || !existsSync(indexHtml)) {
    console.error(
      `\nJMeter 场景 ${scenarioKey} 失败（退出码 ${result.status ?? 'unknown'}）。` +
      '请查看 tests/jmeter/jmeter.log 或终端输出。',
    );
    process.exit(result.status === 0 ? 1 : (result.status ?? 1));
  }

  console.log(`\n完成。打开报告: file:///${reportDir.replace(/\\/g, '/')}/index.html`);
}

const scenarioKey = process.argv[2];
if (!scenarioKey) {
  console.error('用法: node run-jmeter.mjs <browse|purchase|my-tickets|verify>');
  process.exit(1);
}

runScenario(scenarioKey);
