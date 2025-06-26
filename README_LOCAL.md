# Sublink Worker 本地版

这是Sublink Worker的本地版本，已经去除了所有Cloudflare相关依赖，可以在本地直接运行。

## 特性

- ✅ 支持 Singbox、Clash、Surge 配置转换
- ✅ 支持 Xray 配置处理
- ✅ 本地内存缓存（替代Cloudflare KV）
- ✅ 短链接生成和解析
- ✅ 多语言支持
- ✅ 自定义规则集
- ❌ 已移除所有云端存储依赖
- ❌ 已移除Cloudflare Worker支持

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器默认运行在 `http://localhost:3000`

### 3. 自定义端口

可以通过环境变量设置端口：
```bash
PORT=8080 npm start
```

## 使用方法

### Web界面
访问 `http://localhost:3000` 即可使用Web界面。

### API接口

所有原有的API接口都保持不变：

- `GET /` - Web界面
- `GET /singbox?config=...` - Singbox配置转换
- `GET /clash?config=...` - Clash配置转换
- `GET /surge?config=...` - Surge配置转换
- `GET /xray?config=...` - Xray配置处理
- `POST /config` - 保存自定义配置
- `GET /shorten?url=...` - 生成短链接
- `GET /resolve?url=...` - 解析短链接

## 数据存储

本地数据使用内存缓存存储，重启服务器后数据会丢失。如果需要持久化存储，可以考虑：

1. 使用文件系统存储
2. 集成SQLite数据库
3. 使用Redis等外部缓存

## 配置说明

- 缓存默认过期时间：24小时
- 配置保存有效期：30天
- 内存缓存自动清理：每小时检查一次过期项

## 技术栈

- **运行时**: Node.js
- **Web框架**: Express
- **缓存**: node-cache
- **其他**: js-yaml, cors

## 与原版区别

| 功能 | 原版 (Cloudflare Worker) | 本地版 |
|------|-------------------------|--------|
| 运行环境 | Cloudflare Edge | 本地Node.js服务器 |
| 数据存储 | Cloudflare KV | 内存缓存 |
| 部署方式 | wrangler deploy | npm start |
| 数据持久化 | 云端永久存储 | 进程内存（重启丢失） |
| 扩展性 | 全球边缘节点 | 单机服务 |

## 注意事项

1. 本地版本的数据不会持久化，重启服务器后所有缓存数据（包括短链接）都会丢失
2. 如果需要在生产环境使用，建议添加数据持久化方案
3. 服务器只绑定到localhost，如需外部访问请修改服务器配置

## 开发

如果你想为本项目贡献代码：

```bash
# 克隆项目
git clone <repo-url>
cd sublink-worker

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

## 许可证

与原项目保持一致。 