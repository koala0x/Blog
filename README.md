# Blog

这是一个可直接部署到 GitHub Pages 的博客日志项目，默认按日期倒序展示文章。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 新增博客日志

在 `src/posts/` 目录下新增一个 `.md` 文件（文件名会作为文章 slug，比如 `2026-04-16-new-post.md`）。

建议使用 Frontmatter（YAML）写文章元信息：

```md
---
title: 你的标题
date: 2026-04-16
category: trade
tags:
  - 标签1
  - 标签2
summary: 你的摘要内容
---

这里开始写正文（支持 Markdown）。
```

`date` 请使用 `YYYY-MM-DD` 格式，页面会自动按时间倒序排列。

`category` 用于区分日志类型，当前支持：

- `trade`：交易日志
- `tech`：技术日志

## 部署到 GitHub Pages

1. 把代码推送到你的 GitHub 仓库 `main` 分支。
2. 仓库进入 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 `Source: GitHub Actions`。
4. 等待 Actions 工作流 `Deploy Blog to GitHub Pages` 执行完成。

首次部署成功后，访问地址通常是：

`https://<你的用户名>.github.io/<你的仓库名>/`
