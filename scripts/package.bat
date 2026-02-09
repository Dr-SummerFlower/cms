@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0\.."

echo 📦 开始构建并打包 CMS...

:: 前端：安装依赖并构建
echo 📦 安装前端依赖...
cd cms_client
call npm ci
if errorlevel 1 (echo 前端依赖安装失败 & exit /b 1)
echo 🏗️ 构建前端...
call npm run build
if errorlevel 1 (echo 前端构建失败 & exit /b 1)
cd ..

:: 后端：安装依赖并构建
echo 📦 安装后端依赖...
cd cms_server
call npm ci
if errorlevel 1 (echo 后端依赖安装失败 & exit /b 1)
echo 🏗️ 构建后端...
call npm run build
if errorlevel 1 (echo 后端构建失败 & exit /b 1)
cd ..

:: 准备 cms 目录
echo 🗂️ 准备 cms 目录...
if exist cms rmdir /s /q cms
mkdir cms\public

:: 拷贝前端产物到 cms\public（不包含 dist 目录本身）
echo 📥 拷贝前端产物...
xcopy cms_client\dist\* cms\public\ /E /I /Y /Q >nul

:: 拷贝后端 dist、template 与 package.json
echo 📥 拷贝后端产物...
xcopy cms_server\dist\* cms\dist\ /E /I /Y /Q >nul
mkdir cms\template 2>nul
for %%f in (cms_server\template\*) do (
  if not "%%~xf"==".html" if exist "%%f" copy /Y "%%f" cms\template\ >nul
)
copy /Y cms_server\package.json cms\ >nul
copy /Y cms_server\package-lock.json cms\ >nul

:: 生成压缩包文件名
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"') do set TIMESTAMP=%%i
for /f "delims=" %%i in ('git rev-parse --short HEAD 2^>nul') do set GIT_SHA=%%i
if "%GIT_SHA%"=="" set GIT_SHA=nogit
set TAR_NAME=cms-%TIMESTAMP%-%GIT_SHA%.tar.gz

:: 生成 tar.gz（Windows 10+ 内置 tar）
echo 📦 生成压缩包: %TAR_NAME%
tar -czf "%TAR_NAME%" -C cms .

:: 清理临时目录
rmdir /s /q cms

echo ✅ 打包完成: %cd%\%TAR_NAME%
endlocal
