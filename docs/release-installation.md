# 从 GitHub Release 安装 Lapdev

主发布渠道是 [GitHub Releases](https://github.com/TangCan/lapdev/releases)，无需
npm 账号或 Docker。用户需要 Node.js 18+、npm 和系统 tar；当前预构建运行时支持
Linux x64、macOS arm64。以下以 1.0.3 为例，需在该版本正式发布后执行。

## 安装与启动

```sh
npm install --global --prefix "$HOME/.local" \
  https://github.com/TangCan/lapdev/releases/download/v1.0.3/lapdev-cli-1.0.3.tgz
export PATH="$HOME/.local/bin:$PATH"
lapdev version
lapdev web --no-open --workspace /absolute/path/to/project
```

按终端提示访问本机地址。CLI 首次启动会下载固定版本的运行时并验证长度及
SHA-256，随后缓存到 `~/.cache/lapdev/<version>/<platform>-<arch>/`。
`lapdev doctor` 检查已安装的运行时；首次下载前出现 runtime WARN 是正常的。
Git、LSP 等功能仍需对应工具。不需要用 sudo 安装。

CLI 会显示获取 manifest、下载进度与速度、完整性校验、解包和缓存安装阶段。
manifest 每次请求限时 30 秒，运行时每次传输限时 5 分钟；暂时性网络错误或
HTTP 408/429/5xx 最多重试两次。哈希不符、非法来源和越界跳转立即失败，
不会跳过校验或启动未验证的运行时。

使用代理时，建议 Node.js 24.14+。CLI 自动读取大小写 HTTP_PROXY/HTTPS_PROXY
及 Node 原生 NO_PROXY 规则，代理地址和凭据不写入日志。较旧 Node 的直连及
本地 runtime-dir 安装仍受支持；配置代理但缺少原生 API 时会提示升级，
不会悄悄绕开代理直连。

npm 12 默认禁止从 URL 安装；若出现 `EALLOWREMOTE`，仅在本次安装命令加入
`--allow-remote=all`，不需要修改全局配置：

```sh
npm install --allow-remote=all --global --prefix "$HOME/.local" \
  https://github.com/TangCan/lapdev/releases/download/v1.0.3/lapdev-cli-1.0.3.tgz
```

也可使用下述先下载、校验、再安装本地文件的方式。
参见 [npm 官方 allow-remote 说明](https://docs.npmjs.com/cli/install/)。

## 先校验 CLI 再安装

从同一个固定版本 Release 下载 `lapdev-cli-1.0.3.tgz`、`SHA256SUMS`，放入同一目录。
Linux 使用 `sha256sum`，macOS 使用 `shasum -a 256`：

```sh
# Linux
awk '$2 == "lapdev-cli-1.0.3.tgz"' SHA256SUMS | sha256sum --check
# macOS
awk '$2 == "lapdev-cli-1.0.3.tgz"' SHA256SUMS | shasum -a 256 --check

# 校验成功后安装本地文件
npm install --global --prefix "$HOME/.local" ./lapdev-cli-1.0.3.tgz
```

校验文件同时覆盖两个平台的运行时和 `runtime-manifest.json`。哈希用于检测损坏，
不等同于独立签名身份认证。失败时停止安装并重新下载，勿关闭完整性验证。

## 离线、升级与卸载

已有缓存时运行 `lapdev web --offline --no-open`。也可提前下载并校验对应平台的
运行时归档，解包后使用 `lapdev web --runtime-dir /path/to/runtime --no-open`。
保留完整 `bin/`、`lib/`、`app/` 目录，不要只拷贝 server 文件。

升级时从新版本固定 URL 安装 CLI；回退时重新安装旧版本 URL，旧版缓存仍可复用。
卸载 CLI：`npm uninstall --global --prefix "$HOME/.local" @lapdev/cli`。
用户项目不会随卸载删除；运行时缓存可按具体版本手动清理。

## 维护者发布

版本 tag 必须与根包、CLI 包版本一致。Runtime Release 工作流依次执行 CLI 打包、
两个平台运行时构建及实际启动验证，再收集资产生成包含 CLI 的 manifest 与
SHA256SUMS，创建草稿 Release，附齐资产后公开。

已公开 Release 不追加或覆盖资产；草稿上传同名资产也不覆盖。失败后先检查草稿
状态与已上传文件，不要盲目重跑或移动 tag。

发布后 Linux 与 macOS job 会无凭据下载校验全部资产，再从公开 URL 安装 CLI，
自动下载运行时并检查 `/health` 和前端首页。普通 main/PR CI 用本次构建产物验证，
不代表真实公开下载验证已经完成。

npm registry 发布默认跳过；仅当仓库变量 `NPM_PUBLISH_ENABLED=true` 时启用。
启用步骤见 [可选 npm 发布](npm-release-bootstrap.md)。
