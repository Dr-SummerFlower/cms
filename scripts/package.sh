#!/bin/bash
# CMS 项目打包脚本 - 参照 build-and-package.yml 工作流
# 将项目构建并打包成 tar.gz

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 开始构建并打包 CMS..."

# 前端：安装依赖并构建
echo "📦 安装前端依赖..."
(cd cms_client && npm ci)
echo "🏗️ 构建前端..."
(cd cms_client && npm run build)

# 后端：安装依赖并构建
echo "📦 安装后端依赖..."
(cd cms_server && npm ci)
echo "🏗️ 构建后端..."
(cd cms_server && npm run build)

# 准备 cms 目录
echo "🗂️ 准备 cms 目录..."
rm -rf cms
mkdir -p cms/public

# 拷贝前端产物到 cms/public（不包含 dist 目录本身）
echo "📥 拷贝前端产物..."
if command -v rsync &>/dev/null; then
  rsync -a --delete --exclude='.DS_Store' cms_client/dist/ cms/public/
else
  cp -r cms_client/dist/* cms/public/
fi

# 拷贝后端 dist、template 与 package.json
echo "📥 拷贝后端产物..."
if command -v rsync &>/dev/null; then
  rsync -a --delete cms_server/dist/ cms/dist/
  rsync -a --delete --exclude='*.html' cms_server/template/ cms/template/
else
  mkdir -p cms/dist cms/template
  cp -r cms_server/dist/* cms/dist/
  for f in cms_server/template/*; do
    [ -f "$f" ] && [[ "$f" != *.html ]] && cp "$f" cms/template/
  done
fi
cp cms_server/package.json cms/
cp cms_server/package-lock.json cms/

# 生成压缩包
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'nogit')"
TAR_NAME="cms-$(date +%Y%m%d-%H%M%S)-${GIT_SHA}.tar.gz"
echo "📦 生成压缩包: $TAR_NAME"
tar -czf "$TAR_NAME" -C cms .

# 清理临时目录
rm -rf cms

echo "✅ 打包完成: $PROJECT_ROOT/$TAR_NAME"
