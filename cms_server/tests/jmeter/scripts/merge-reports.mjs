import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { JMETER_ROOT, parseCsvLine, resolveJmeterBin } from './env.mjs';

const SCENARIOS = [
  { key: 'browse', jtl: 'browse.jtl' },
  { key: 'purchase', jtl: 'purchase.jtl' },
  { key: 'my-tickets', jtl: 'my-tickets.jtl' },
  { key: 'verify', jtl: 'verify.jtl' },
];

function csvEscape(cell) {
  const text = String(cell ?? '');
  if (text.includes('"')) return `"${text.replace(/"/g, '""')}"`;
  if (text.includes(',') || text.includes('\n') || text.includes('\r')) return `"${text}"`;
  return text;
}

function mergeJtlFiles(resultsDir, outPath) {
  const sources = SCENARIOS.map((s) => ({
    key: s.key,
    path: resolve(resultsDir, s.jtl),
  })).filter((s) => existsSync(s.path));

  if (sources.length === 0) {
    throw new Error('未找到任何 .jtl 结果文件，请先执行 npm run perf:all 或分别执行各 perf:* 场景');
  }

  let header = null;
  let headerFields = null;
  let labelIndex = 2;
  const mergedLines = [];

  for (const src of sources) {
    const content = readFileSync(src.path, 'utf8').trim();
    if (!content) continue;

    const lines = content.split(/\r?\n/);
    const currentHeader = lines[0];

    if (!header) {
      header = currentHeader;
      headerFields = parseCsvLine(currentHeader);
      const idx = headerFields.findIndex((f) => String(f).trim() === 'label');
      if (idx >= 0) labelIndex = idx;
      mergedLines.push(header);
    }

    const dataLines = lines.slice(1);
    for (const line of dataLines) {
      if (!line.trim()) continue;
      const fields = parseCsvLine(line);
      if (fields.length <= labelIndex) {
        mergedLines.push(line);
        continue;
      }
      fields[labelIndex] = `${src.key} - ${fields[labelIndex]}`;
      mergedLines.push(fields.map(csvEscape).join(','));
    }
  }

  writeFileSync(outPath, `${mergedLines.join('\n')}\n`, 'utf8');
}

function main() {
  const resultsDir = resolve(JMETER_ROOT, 'results');
  const htmlReportRoot = resolve(resultsDir, 'html-report');
  const outJtl = resolve(resultsDir, 'all.jtl');
  const outReportDir = resolve(htmlReportRoot, 'all');

  mkdirSync(resultsDir, { recursive: true });
  mkdirSync(htmlReportRoot, { recursive: true });

  if (existsSync(outReportDir)) {
    rmSync(outReportDir, { recursive: true, force: true });
  }
  if (existsSync(outJtl)) {
    rmSync(outJtl, { force: true });
  }

  mergeJtlFiles(resultsDir, outJtl);

  const jmeterBin = resolveJmeterBin();
  const result = spawnSync(
    jmeterBin,
    ['-g', outJtl.replace(/\\/g, '/'), '-o', outReportDir.replace(/\\/g, '/')],
    { stdio: 'inherit', cwd: JMETER_ROOT, env: process.env, shell: platform() === 'win32' },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const indexHtml = join(outReportDir, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error('合并报告生成失败：未找到 all/index.html');
  }

  console.log(`\n完成。打开合并报告: file:///${indexHtml.replace(/\\/g, '/')}`);
}

main();

