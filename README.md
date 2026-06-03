# 云藏下载助手

一个可部署的网页工具：把文件链接粘贴进去，服务端负责抓取并直接返回下载文件。

## 现在已经整理好的内容

- 已初始化 Git 仓库，默认分支为 `main`
- 前端静态页面已放到 `public/`
- 后端入口为 `server.py`，适合本地运行，也适合部署到 Vercel
- 已添加 `.gitignore`，会忽略下载产物、临时文件和本地环境文件

## 功能

- 支持普通 `http/https` 文件链接下载
- 针对 `wenku.yongzin.com` 文库页，支持自动转成更适合 WPS 打开的 `docx`
- 前端与后端都使用相对地址，适合部署到公网

## 本地运行

1. 安装依赖
   `pip install -r requirements.txt`
2. 启动服务
   `python server.py`
3. 打开浏览器访问
   `http://127.0.0.1:4173`

## 项目结构

- `server.py`: Flask 服务入口，也是 Vercel 的 Python 应用入口
- `public/`: 前端静态文件
- `requirements.txt`: Python 依赖
- `vercel.json`: Vercel 打包排除配置

## 上传到 GitHub

如果你电脑里还没有设置 Git 提交身份，先执行一次：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

然后去 GitHub 新建一个空仓库。
注意：不要勾选 `README`、`LICENSE`、`.gitignore` 初始化，避免第一次推送冲突。

接着在项目目录执行：

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

如果你更想直接一步创建并推送，也可以用 GitHub CLI：

```bash
gh repo create <仓库名> --source=. --public --remote=origin --push
```

## 部署到 Vercel

### 方式一：连接 GitHub 部署

1. 先把当前代码推到 GitHub
2. 登录 Vercel
3. 点击 `Add New...` -> `Project`
4. 选择这个仓库
5. 保持默认设置，直接部署

部署完成后，Vercel 会给你一个公网网址。这个网址发给别人后，对方无论用 Wi-Fi 还是移动数据都可以打开。  
这份配置已经把 `server.py` 当作后端一起部署了，所以下载不再依赖“纯静态页面”。

### 方式二：命令行部署

```bash
npm i -g vercel
vercel
```

首次执行会让你登录并绑定项目，后续正式发布可用：

```bash
vercel --prod
```
