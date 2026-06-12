/**
 * Docker 部署构建脚本
 * 将 nest build 产物及运行时依赖文件拷贝至 cms_data/server/
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(__dirname, '..');
const targetDir = resolve(serverRoot, '..', 'cms_data', 'server');

// 清空目标目录
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

// 拷贝编译产物
cpSync(resolve(serverRoot, 'dist'), targetDir, { recursive: true });

// 拷贝 package 文件（容器启动时安装依赖需要）
copyFileSync(
  resolve(serverRoot, 'package.json'),
  resolve(targetDir, 'package.json'),
);
copyFileSync(
  resolve(serverRoot, 'package-lock.json'),
  resolve(targetDir, 'package-lock.json'),
);

// 拷贝邮件模板
cpSync(resolve(serverRoot, 'template'), resolve(targetDir, 'template'), {
  recursive: true,
});

console.log('✅ 后端构建产物已输出至 cms_data/server/');
