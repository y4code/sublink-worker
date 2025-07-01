# Sublink Worker (前端版)

一个纯前端的订阅链接/代理链接转换工具，可以生成 Clash 客户端兼容的配置文件。本项目不依赖任何后端服务，所有操作都在您的浏览器中完成，确保了隐私和安全。

## ✨ 功能

- **纯前端实现**: 无需服务器，可以直接在浏览器中运行。
- **支持多种代理协议**: 支持 Shadowsocks (SS), Vmess, Vless, Trojan, Hysteria2, 和 TUIC 链接的解析。
- **支持订阅链接**: 可以处理单个或多个订阅链接（需要后端支持 CORS 或使用 CORS 代理）。
- **Base64 解码**: 自动解码 Base64 编码的链接。
- **Clash 配置生成**: 将解析出的代理节点转换为 Clash 配置文件格式。

## 🚀 如何使用

- 克隆或下载此仓库, 在现代浏览器中打开 `index.html` 文件。
- 或者访问 [y4code.github.io/sublink-worker/](https://y4code.github.io/sublink-worker/)

## 🛠️ 技术栈

- HTML & CSS & JavaScript
- [js-yaml](https://github.com/nodeca/js-yaml)

<img width="1142" alt="image" src="https://github.com/user-attachments/assets/d1f81e7e-2645-4d48-9e5a-d7e9cee83446" />

