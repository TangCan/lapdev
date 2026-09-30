# 外部分发能力摘录

访问日期：2026-09-30。页面未声明发布日期时记为未标注；检索抓取时间不是发布日期。

- claim: GitHub Release 公开资产 API 可无认证下载，客户端需要处理 200/302。source: https://docs.github.com/en/rest/releases/assets ; publisher: GitHub ; pub_date: 未标注 ; confidence: medium ; class: compatibility ; status: unverified（官方单源）。
- claim: npm install 支持 tarball URL，因此安装包文件不必先发布到 npm registry。source: https://docs.npmjs.com/cli/install/ ; publisher: npm ; pub_date: 未标注 ; confidence: medium ; class: compatibility ; status: unverified（官方单源）。
- claim: Homebrew 自建 tap 本质上是 Git 仓库，可自主管理和更新公式。source: https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap ; publisher: Homebrew ; pub_date: 未标注 ; confidence: medium ; class: landscape ; status: unverified（官方单源）。
- claim: GitHub Packages 的 npm registry 对公开包安装也要求 token，不能作为匿名安装的同等替代。source: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry ; publisher: GitHub ; pub_date: 未标注 ; confidence: medium ; class: authentication ; status: unverified（官方单源）。
- claim: 开启 immutable releases 时建议先创建 draft、附齐资产再公开。source: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository ; publisher: GitHub ; pub_date: 未标注 ; confidence: medium ; class: compatibility ; status: unverified（官方单源）。

后续核对：npm exec URL 包规格；独立项目使用 GitHub Release 安装的实践；当前运行时归档目录依赖。未找到足以归因 npm 注册失败的证据，不推断 npm 整体不可注册。
