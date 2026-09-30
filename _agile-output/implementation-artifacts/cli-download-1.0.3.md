# CLI 下载修复 1.0.3

日期：2026-09-30。

诊断：本机 http_proxy/https_proxy 已设置，Node fetch 默认未采用代理。分阶段探针中
manifest 获取约 1 秒；运行时收到 HTTP 200 后传输缓慢，45 秒窗口未完成，已收到
约 5 MiB。相同 Node 探针启用 http.setGlobalProxyFromEnv 后，38,787,755 字节的
完整归档在约 5.5 秒传输完成。curl 使用环境代理时完整下载也约 5.5 秒。
因此此前超时发生在归档传输阶段，不能归因于服务启动失败。

实现：读取 Node 原生 HTTP/HTTPS 代理及 NO_PROXY 规则；自动代理支持要求
setGlobalProxyFromEnv API（Node 24.14+），较旧 Node 配置代理时给出升级/本地安装
提示。代理地址及凭据不输出。下载流式写入临时文件，计算 SHA-256，限制实际长度；
成功校验后才解包并安装到缓存。manifest 限时 30 秒且最多 1 MiB；运行时每次
限时 300 秒；网络、408/429/500/502/503/504 最多重试两次，部分下载从零开始。
哈希错误、非法来源、越界跳转、非法 JSON 不重试。失败清理临时产物。

CLI 输出 manifest、下载进度/速度/重试次数、完整性检查、解包及缓存阶段；启动
验证将下载总预算与服务启动 60 秒预算分开，并在失败时报告所在阶段。

证据：16 个 Node 下载/发布测试、16 个现有 Deno CLI/发布测试通过；新模块在本机
下载真实 v1.0.2 归档并验证 SHA-256，总耗时约 9.1 秒。实际构建本机 Linux x64
1.0.3 运行时后，打包 CLI 的安装、健康接口与首页检查通过。正式版本的默认 URL
完整安装将在发布后再次核对。

官方 API 依据：https://nodejs.org/api/http.html#httpsetglobalproxyfromenvproxyenv 。
保留 v1.0.2 资产与 tag；新版本采用 v1.0.3，不启用 npm registry 发布。
