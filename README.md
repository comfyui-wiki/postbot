<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">PostBot 本地浏览器发布版</h1>
<h4 align="center">
	基于 PostBot 开源项目的本地化分支，专注于通过浏览器本地登录状态直接向各媒体平台发布内容，无需云端账号或后端服务。
</h4>
<p align="center">
	<a href="https://github.com/comfyui-wiki/postbot/blob/main/LICENSE" style="display:inline-block;margin:5px;">
		<img src="https://img.shields.io/github/license/comfyui-wiki/postbot.svg?labelColor=47caff&color=bd34fe">
	</a>
</p>

---

## 这是什么？

这是 [PostBot](https://github.com/gitcoffee-os/postbot) 的本地化改造版本，仓库地址：[https://github.com/comfyui-wiki/postbot](https://github.com/comfyui-wiki/postbot)（分支：`remove-login`）。

**核心变化**：移除了与云端后端（exmay.com）的登录、发布等依赖，只保留并强化「通过浏览器本地 Cookie 直接向平台发布」的功能，让你无需注册/登录任何 PostBot 账号即可使用。

---

## 核心特性（本地版）

### 🔐 完全本地化，无需后端
- 直接复用浏览器当前的登录状态（Cookie），不经过任何云端服务器。
- 不收集、不上传账号信息，隐私更安全。

### 🚀 一键本地发布
- 在扩展侧栏填写标题、正文、图片，选择平台后一键发布。
- 支持文章、动态等内容类型，支持图片（URL 或本地文件）。

### 🌍 多平台支持
- 微信公众号、微博、今日头条、小红书、知乎、百家号、哔哩哔哩（B站动态/文章）、抖音、快手、视频号等主流平台。

### 📋 自动获取登录平台
- 点击「获取登录信息」，自动检测浏览器已登录的平台，并自动填入发布目标。

### 🧩 基于 Plasmo + Vue 3
- Chrome 扩展，使用 Plasmo 框架构建，侧栏 UI 基于 Vue 3。

---

## 与官方版本的区别

| 功能 | 官方版 | 本地版（本仓库） |
|------|--------|-----------------|
| 云端账号登录 | ✅ | ❌ 已移除 |
| 云端发布/同步 | ✅ | ❌ 已移除 |
| 本地浏览器直接发布 | ✅ | ✅ 保留并强化 |
| exmay.com 登录跳转 | ✅ | ❌ 已移除 |
| 发布侧栏 UI | ✅ | ✅ 简化为纯本地发布界面 |
| 图片上传（URL/本地） | ✅ | ✅ 支持 |

---

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 加载扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择 `build/chrome-mv3-dev`（开发）或 `build/chrome-mv3-prod`（生产）目录

---

## 使用方法

1. 安装扩展后，点击浏览器工具栏的 PostBot 图标，侧栏自动打开。
2. 点击「获取登录信息」，检测已登录的平台。
3. 选择发布平台、内容类型（文章/动态），填写标题、正文、图片。
4. 点击「发布」，扩展会自动打开对应平台的发布页并填入内容。

---

## 已知问题 / 待修复

- **B 站动态图片上传**：图片有时无法自动填入上传区域，与 B 站页面结构和 `input[type="file"]` 的激活时机有关，仍在排查中（详见 `docs/ISSUE-BILIBILI-DYNAMIC-IMAGES-NOT-ADDED.md`）。
- **多余标签页**：部分场景下发布后会多开不预期的标签，已做多层防护，仍在排查中（详见 `docs/ISSUE-MULTIPLE-TABS-OPENING.md`）。

---

## 上游项目

本项目基于 [PostBot](https://github.com/gitcoffee-os/postbot) 开源版本修改，遵循原项目 License。

- 本仓库地址：[https://github.com/comfyui-wiki/postbot](https://github.com/comfyui-wiki/postbot)
- 上游仓库：[https://github.com/gitcoffee-os/postbot](https://github.com/gitcoffee-os/postbot)

## ⚖️ License

遵循 [GitCoffee Open Source License](https://github.com/gitcoffee-os/postbot/blob/main/LICENSE)，本质上是 Apache License 2.0，附带部分额外限制。
