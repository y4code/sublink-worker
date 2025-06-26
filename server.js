import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import { SingboxConfigBuilder } from './src/SingboxConfigBuilder.js';
import { generateHtml } from './src/htmlBuilder.js';
import { ClashConfigBuilder } from './src/ClashConfigBuilder.js';
import { SurgeConfigBuilder } from './src/SurgeConfigBuilder.js';
import { decodeBase64, encodeBase64, GenerateWebPath } from './src/utils.js';
import { PREDEFINED_RULE_SETS } from './src/config.js';
import { t, setLanguage } from './src/i18n/index.js';
import yaml from 'js-yaml';

const app = express();
const port = process.env.PORT || 3000;

// 创建本地缓存替代Cloudflare KV
const cache = new NodeCache({ 
  stdTTL: 86400, // 默认24小时过期
  checkperiod: 3600 // 每小时检查过期项
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 模拟SUBLINK_KV接口
const SUBLINK_KV = {
  get: async (key) => {
    return cache.get(key) || null;
  },
  put: async (key, value, options = {}) => {
    const ttl = options.expirationTtl || 86400; // 默认24小时
    cache.set(key, value, ttl);
  }
};

// 主要的请求处理函数，从原来的Worker代码移植
async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    setLanguage(lang || request.headers.get('accept-language')?.split(',')[0]);
    
    if (request.method === 'GET' && url.pathname === '/') {
      // Return the HTML form for GET requests
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: generateHtml('', '', '', '', url.origin)
      };
    } else if (url.pathname.startsWith('/singbox') || url.pathname.startsWith('/clash') || url.pathname.startsWith('/surge')) {
      const inputString = url.searchParams.get('config');
      let selectedRules = url.searchParams.get('selectedRules');
      let customRules = url.searchParams.get('customRules');
      // 获取语言参数，如果为空则使用默认值
      let lang = url.searchParams.get('lang') || 'zh-CN';
      // Get custom UserAgent
      let userAgent = url.searchParams.get('ua');
      if (!userAgent) {
        userAgent = 'curl/7.74.0';
      }

      if (!inputString) {
        return { status: 400, body: t('missingConfig') };
      }

      if (PREDEFINED_RULE_SETS[selectedRules]) {
        selectedRules = PREDEFINED_RULE_SETS[selectedRules];
      } else {
        try {
          selectedRules = JSON.parse(decodeURIComponent(selectedRules));
        } catch (error) {
          console.error('Error parsing selectedRules:', error);
          selectedRules = PREDEFINED_RULE_SETS.minimal;
        }
      }

      // Deal with custom rules
      try {
        customRules = JSON.parse(decodeURIComponent(customRules));
      } catch (error) {
        console.error('Error parsing customRules:', error);
        customRules = [];
      }

      // Modify the existing conversion logic
      const configId = url.searchParams.get('configId');
      let baseConfig;
      if (configId) {
        const customConfig = await SUBLINK_KV.get(configId);
        if (customConfig) {
          baseConfig = JSON.parse(customConfig);
        }
      }

      let configBuilder;
      if (url.pathname.startsWith('/singbox')) {
        configBuilder = new SingboxConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent);
      } else if (url.pathname.startsWith('/clash')) {
        configBuilder = new ClashConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent);
      } else {
        configBuilder = new SurgeConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent)
          .setSubscriptionUrl(url.href);
      }

      const config = await configBuilder.build();

      // 设置正确的 Content-Type 和其他响应头
      const headers = {
        'content-type': url.pathname.startsWith('/singbox')
          ? 'application/json; charset=utf-8'
          : url.pathname.startsWith('/clash')
            ? 'text/yaml; charset=utf-8'
            : 'text/plain; charset=utf-8'
      };

      // 如果是 Surge 配置，添加 subscription-userinfo 头
      if (url.pathname.startsWith('/surge')) {
        headers['subscription-userinfo'] = 'upload=0; download=0; total=10737418240; expire=2546249531';
      }

      return {
        status: 200,
        headers,
        body: url.pathname.startsWith('/singbox') ? JSON.stringify(config, null, 2) : config
      };

    } else if (url.pathname === '/shorten') {
      const originalUrl = url.searchParams.get('url');
      if (!originalUrl) {
        return { status: 400, body: t('missingUrl') };
      }

      const shortCode = GenerateWebPath();
      await SUBLINK_KV.put(shortCode, originalUrl);

      const shortUrl = `${url.origin}/s/${shortCode}`;
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortUrl })
      };

    } else if (url.pathname === '/shorten-v2') {
      const originalUrl = url.searchParams.get('url');
      let shortCode = url.searchParams.get('shortCode');

      if (!originalUrl) {
        return { status: 400, body: 'Missing URL parameter' };
      }

      // Create a URL object to correctly parse the original URL
      const parsedUrl = new URL(originalUrl);
      const queryString = parsedUrl.search;

      if (!shortCode) {
        shortCode = GenerateWebPath();
      }

      await SUBLINK_KV.put(shortCode, queryString);

      return {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: shortCode
      };

    } else if (url.pathname.startsWith('/b/') || url.pathname.startsWith('/c/') || url.pathname.startsWith('/x/') || url.pathname.startsWith('/s/')) {
      const shortCode = url.pathname.split('/')[2];
      const originalParam = await SUBLINK_KV.get(shortCode);
      let originalUrl;

      if (url.pathname.startsWith('/b/')) {
        originalUrl = `${url.origin}/singbox${originalParam}`;
      } else if (url.pathname.startsWith('/c/')) {
        originalUrl = `${url.origin}/clash${originalParam}`;
      } else if (url.pathname.startsWith('/x/')) {
        originalUrl = `${url.origin}/xray${originalParam}`;
      } else if (url.pathname.startsWith('/s/')) {
        originalUrl = `${url.origin}/surge${originalParam}`;
      }

      if (originalParam === null) {
        return { status: 404, body: t('shortUrlNotFound') };
      }

      return { status: 302, redirect: originalUrl };
    } else if (url.pathname.startsWith('/xray')) {
      // Handle Xray config requests
      const inputString = url.searchParams.get('config');
      const proxylist = inputString.split('\n');

      const finalProxyList = [];
      // Use custom UserAgent (for Xray) Hmmm...
      let userAgent = url.searchParams.get('ua');
      if (!userAgent) {
        userAgent = 'curl/7.74.0';
      }
      let headers = {
        "User-Agent": userAgent
      };

      for (const proxy of proxylist) {
        if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
          try {
            const response = await fetch(proxy, {
              method: 'GET',
              headers: headers
            });
            const text = await response.text();
            let decodedText;
            decodedText = decodeBase64(text.trim());
            // Check if the decoded text needs URL decoding
            if (decodedText.includes('%')) {
              decodedText = decodeURIComponent(decodedText);
            }
            finalProxyList.push(...decodedText.split('\n'));
          } catch (e) {
            console.warn('Failed to fetch the proxy:', e);
          }
        } else {
          finalProxyList.push(proxy);
        }
      }

      const finalString = finalProxyList.join('\n');

      if (!finalString) {
        return { status: 400, body: 'Missing config parameter' };
      }

      return {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: encodeBase64(finalString)
      };
    } else if (url.pathname === '/favicon.ico') {
      return { status: 301, redirect: 'https://cravatar.cn/avatar/9240d78bbea4cf05fb04f2b86f22b18d?s=160&d=retro&r=g' };
    } else if (url.pathname === '/config') {
      // This would be handled by POST request
      return { status: 405, body: 'Method not allowed' };
    } else if (url.pathname === '/resolve') {
      const shortUrl = url.searchParams.get('url');
      if (!shortUrl) {
        return { status: 400, body: t('missingUrl') };
      }

      try {
        const urlObj = new URL(shortUrl);
        const pathParts = urlObj.pathname.split('/');
        
        if (pathParts.length < 3) {
          return { status: 400, body: t('invalidShortUrl') };
        }

        const prefix = pathParts[1]; // b, c, x, s
        const shortCode = pathParts[2];

        if (!['b', 'c', 'x', 's'].includes(prefix)) {
          return { status: 400, body: t('invalidShortUrl') };
        }

        const originalParam = await SUBLINK_KV.get(shortCode);
        if (originalParam === null) {
          return { status: 404, body: t('shortUrlNotFound') };
        }

        let originalUrl;
        if (prefix === 'b') {
          originalUrl = `${url.origin}/singbox${originalParam}`;
        } else if (prefix === 'c') {
          originalUrl = `${url.origin}/clash${originalParam}`;
        } else if (prefix === 'x') {
          originalUrl = `${url.origin}/xray${originalParam}`;
        } else if (prefix === 's') {
          originalUrl = `${url.origin}/surge${originalParam}`;
        }

        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalUrl })
        };
      } catch (error) {
        return { status: 400, body: t('invalidShortUrl') };
      }
    }

    return { status: 404, body: t('notFound') };
  } catch (error) {
    console.error('Error processing request:', error);
    return { status: 500, body: t('internalError') };
  }
}

// Express路由处理
app.all('*', async (req, res) => {
  // 构造Request对象
  const protocol = req.secure ? 'https' : 'http';
  const host = req.get('host');
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;
  
  const request = {
    method: req.method,
    url: fullUrl,
    headers: {
      get: (name) => req.get(name),
      'accept-language': req.get('accept-language')
    }
  };

  const result = await handleRequest(request);
  
  if (result.redirect) {
    res.redirect(result.status, result.redirect);
  } else {
    res.status(result.status);
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
    }
    res.send(result.body);
  }
});

// POST /config 路由
app.post('/config', async (req, res) => {
  try {
    const { type, content } = req.body;
    const configId = `${type}_${GenerateWebPath(8)}`;

    let configString;
    if (type === 'clash') {
      // 如果是 YAML 格式，先转换为 JSON
      if (typeof content === 'string' && (content.trim().startsWith('-') || content.includes(':'))) {
        const yamlConfig = yaml.load(content);
        configString = JSON.stringify(yamlConfig);
      } else {
        configString = typeof content === 'object'
          ? JSON.stringify(content)
          : content;
      }
    } else {
      // singbox 配置处理
      configString = typeof content === 'object'
        ? JSON.stringify(content)
        : content;
    }

    // 验证 JSON 格式
    JSON.parse(configString);

    await SUBLINK_KV.put(configId, configString, {
      expirationTtl: 60 * 60 * 24 * 30  // 30 days
    });

    res.set('Content-Type', 'text/plain');
    res.send(configId);
  } catch (error) {
    console.error('Config validation error:', error);
    res.status(400).set('Content-Type', 'text/plain');
    res.send(t('invalidFormat') + error.message);
  }
});

app.listen(port, () => {
  console.log(`本地代理配置服务器已启动，访问 http://localhost:${port}`);
  console.log(`Local proxy config server is running at http://localhost:${port}`);
}); 