# Sublink Worker (Lite) - 轻量版

一个轻量级的、纯后端的服务，用于将代理订阅链接转换为 Clash 兼容的 `proxies` 列表。

该项目经过精简，只执行一个核心功能：接收一个或多个代理 URL（如 VLESS、SS、Trojan 等），并返回一个为 Clash 配置文件格式化的 YAML `proxies` 列表。

## ✨ 特性

- **轻量级**：没有用户界面，没有复杂的规则引擎。只有一个 API 端点。
- **专注 Clash**: 生成可直接插入 Clash 配置文件的 YAML `proxies` 列表。
- **多协议支持**：解析多种代理协议，包括 VLESS、VMess、Shadowsocks、Trojan 等。

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [Bun](https://bun.sh/) 或 npm/yarn 用于包管理

### 安装

1.  克隆仓库：
    ```bash
    git clone <repository_url>
    cd sublink-worker
    ```

2.  安装依赖：
    ```bash
    # 使用 Bun
    bun install

    # 或使用 npm
    npm install
    ```

### 运行服务

您可以使用以下命令启动服务器：

```bash
# 使用 Bun
bun start

# 或使用 npm
npm start
```

服务将在 `http://localhost:3000` 上启动。

## 📖 API 用法

服务器只提供一个端点：`POST /`。

向此端点发送 `POST` 请求，请求正文中以纯文本形式包含代理 URL。每个 URL 应占一行。

### 示例

以下是使用 `curl` 转换一个 VLESS Reality 链接的示例：

```bash
curl --request POST 'http://localhost:3000/' \
--header 'Content-Type: text/plain' \
--data 'vless://a7a5a8f5-a8f8-4a4b-a2a1-e4a8d4a4a4a4@example.com:443?type=tcp&security=reality&pbk=abcdef&fp=chrome&sni=example.com&sid=1234abcd#VLESS-Reality'
```

### 成功响应

服务器将以 `200 OK` 状态响应，并在响应体中返回 YAML 格式的代理列表，例如：

```yaml
proxies:
  - name: VLESS-Reality
    type: vless
    server: example.com
    port: 443
    uuid: a7a5a8f5-a8f8-4a4b-a2a1-e4a8d4a4a4a4
    tls: true
    client-fingerprint: chrome
    servername: example.com
    network: tcp
    reality-opts:
      public-key: abcdef
      short-id: 1234abcd
    tfo: false
    skip-cert-verify: false

```
