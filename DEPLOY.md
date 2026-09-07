# VOx Envirotech — GitHub Pages 部署（含 DeepSeek 联网助手）

## 目标

- 域名：`www.voxenviro.com`
- 托管：GitHub Pages（静态文件）
- 一键部署：`git push` 到 `main` 分支即自动发布
- DeepSeek：通过 Cloudflare Worker 代理（GitHub Pages 只能托管静态文件，不能跑 Node/Python）

## 1. 一次性准备（本机）

1. 安装 Git：https://git-scm.com/
2. 设置 GitHub 登录信息：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

## 2. 建仓库并推送

在 GitHub 新建仓库 `vox-envirotech`（Public），然后在站点目录执行：

```bash
cd "C:\Users\DELL\Documents\Codex\2026-09-04\ka\outputs\vox-envirotech"
git init
git add .
git commit -m "Initial VOx Envirotech site"
git branch -M main
git remote add origin https://github.com/你的用户名/vox-envirotech.git
git push -u origin main
```

推送后，`.github/workflows/deploy.yml` 会自动运行并把站点发布到 GitHub Pages。

## 3. 开启 Pages + 绑定域名

1. 仓库 `Settings` → `Pages` → `Build and deployment` 的 Source 选 `GitHub Actions`。
2. `Custom domain` 填 `www.voxenviro.com` → Save。
3. 在域名 DNS 处添加一条 CNAME 记录：

```text
名称: www
类型: CNAME
值: 你的用户名.github.io
```

4. 等待 DNS 生效（几分钟到几小时），GitHub 会自动签发 HTTPS 证书。

## 4. DeepSeek 联网（Cloudflare Worker）

1. 注册 Cloudflare，安装 Wrangler：`npm install -g wrangler`
2. 登录：`wrangler login`
3. 在 `vox-envirotech` 目录初始化并部署：

```bash
wrangler deploy worker.js
```

4. 设置 DeepSeek 密钥（密钥保存在 Cloudflare，不进代码）：

```bash
wrangler secret put DEEPSEEK_API_KEY
```

5. 部署后会得到一个地址，形如 `https://vox-assistant.你的子域.workers.dev`。

## 5. 让前端调用 Worker

打开 `js/assistant.js`，把这一行改成你的 Worker 地址：

```js
var ASSISTANT_API = "https://vox-assistant.你的子域.workers.dev/api/assistant";
```

改完提交并推送：

```bash
git add js/assistant.js
git commit -m "Point assistant to DeepSeek worker"
git push
```

> 不配置 Worker 时，AI 助手会自动退回内置知识库回答（离线可用）。

## 6. 以后每次更新

```bash
git add .
git commit -m "update"
git push
```

`git push` 后 GitHub Actions 会自动部署，稍等约 1 分钟刷新 `https://www.voxenviro.com/` 即可。
