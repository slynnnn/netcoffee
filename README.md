# IP 工具 — 自有版 IP 检测工具站

本站是参照 ip.net.coffee 这类工具站的**功能与版式思路**重新写的自有实现：所有代码、文案、样式名均为本站原创，没有复制对方源码、Logo、图片或长篇文章。目标是把它变成你自己的资产：换域名、换品牌名、改配色都可以直接改。

- 布局：白底、居中单列（最宽 760px）、顶部单行导航 + 主题按钮（浅色 / 深色 / 跟随系统）、圆角卡片、底部只有工具链接。
- 原则：免费、无登录、无付费墙、不在服务器记录查询；历史只存在浏览器 localStorage。

## 工具清单（13 个，全部从顶部导航 + 首页可达）

| 路径 | 功能 |
|---|---|
| `/` index.html | 当前 IPv4/IPv6、归属地/ISP/类型、隐藏 IP 开关、6 站延迟预览、分流出口表（国内/国际 × 社交/AI/加密/工具/测速/静态/开发/媒体，37 站） |
| `/claude.html` | Claude 出口 IP 纯净度、0–100 启发式分数、类型/ASN、安全信号、claude.ai 与 anthropic.com 延迟、设备/时区/指纹摘要 |
| `/ip.html` | IP 深度评分：输入为空 = 当前 IP；地理/ASN/ISP、Bogon、反向 DNS 说明、常见端口浏览器近似、风险信号、多源地理 + 地图链接、BGP 说明、外链 Shodan / AbuseIPDB / VirusTotal / BGP.tools（仅链接） |
| `/gpt.html` | ChatGPT / Codex 同款：chatgpt.com、api.openai.com、openai.com 三行分开测，Codex 用户看 API 行 |
| `/link.html` | 网络连通：中国 / 日本 / 美国 / 全球四组，每站 ms 与优/良/慢/超时颜色，每组可达数 + 平均延迟 |
| `/dns.html` | DNS 泄露：公共 DoH 解析器实测 + 简短自查指南；见下方“诚实边界” |
| `/webrtc.html` | WebRTC / STUN：多公共 STUN 服务器、收集全部 IP、与出口 IP 对比、代理模式与 TUN 模式差异说明 |
| `/cloudflare.html` | Cloudflare：cdn-cgi/trace 的 colo 代码 + 城市、WARP、HTTP/TLS、等级对比表（免费/企业/WARP/测速/静态/Workers）、测速（需手动确认，见警告）、启发式风险、Turnstile 占位说明 |
| `/ping.html` | 全球 Ping：浏览器 3 次 min/avg/max + 20 节点表（亚洲 8、美洲 4、欧洲 8）+ 边缘 Function 近似；见下方“诚实边界” |
| `/status.html` | 服务状态：31 个服务（AI 8、云服务 6、开发 12、社区 5），故障置顶、运行中在下、未知不猜正常；经 `/api/status`，10 分钟缓存 |
| `/whois.html` | Whois / RDAP：域名 / IPv4 / IPv6 / AS 号，RDAP 优先，状态代码中文说明 |
| `/news.html` | AI 资讯：分类（全部/OpenAI/Claude/ChatGPT/Codex/API/Claude Code/Gemini/MCP）+ 分页，经 `/api/news` 抓公开 RSS |
| `/card/` card/index.html | IP 卡片：8 种原创样式、7 种配色（含跟随样式）、6 种贴纸、宽度 240/360/480/560、随机组合、SVG 预览、下载 PNG/SVG、HTML / Markdown / BBCode 嵌入代码、分享链接（hash 参数，不上传 IP） |

## 本地运行

```bash
cd netcoffee
python3 -m http.server 8000
# 打开 http://localhost:8000/
# 注意：本地静态预览时 /api/* 会 404，前端会自动降级（状态页直连官方接口、新闻与边缘 Ping 显示“未部署”），
# 这是预期行为，不是 bug。完整功能需部署到 Pages 或 Vercel。
```

验证（已在本机跑过）：

```bash
python3 -m http.server 8000 >/tmp/nc.log 2>&1 &
for p in / /claude.html /ip.html /gpt.html /link.html /dns.html /webrtc.html /cloudflare.html /ping.html /status.html /whois.html /news.html /card/ /assets/style.css /assets/app.js; do curl -s -o /dev/null -w "$p %{http_code}\n" "http://localhost:8000$p"; done
node --check assets/app.js api/*.js
```

## 部署到 Cloudflare Pages

1. 把本目录推到一个 Git 仓库（或直接拖进 Pages 的上传部署）。
2. Pages 项目设置：构建命令留空，输出目录留空（根目录即站点）；Functions 会自动识别 `functions/api/*`。
3. 绑定你的域名（如 `ip.你的域名`），Pages 会自动发证书。
4. 可选环境变量（Pages → Settings → Environment variables）：`IPINFO_TOKEN`、`PING_API_URL`，见下表。

## 部署到 Vercel

1. 把本目录推到 Git 仓库，Vercel 导入该仓库；框架选 Other，构建命令留空，输出目录留空。
2. Serverless Functions 自动识别 `api/*`，前端调用的 `/api/*` 路径与 Pages 版一致，无需改前端代码。
3. 绑定域名，可选环境变量同上（Vercel → Settings → Environment Variables）。

两个平台不要同时用同一套前端改路径：前端统一调 `/api/status`、`/api/whois`、`/api/news`、`/api/ping`、`/api/ip`，Pages 用 `functions/api/`，Vercel 用 `api/`，逻辑已对齐。

## 每个工具“真做了什么” vs “还需要什么”

### 完全在浏览器里真做的（无服务器、无密钥）
- IP 查询 / 分流延迟 / 网络连通 / WebRTC STUN / Cloudflare trace / IP 卡片生成：全部是浏览器直接发请求或本地计算，结果真实反映访问者当前线路。
- IP 评分、Claude/GPT 分数：**启发式分数**，用免费接口（ip-api.com、ipapi.co、Cloudflare trace）的机房/代理/移动信号加权。不是 IPinfo / ipapi.is 的商业分数，也不是 Anthropic / OpenAI 的官方风控分数；70/50 分界只是本站参考口径。

### 浏览器 + Function 近似（已实现，不伪造）
- 服务状态：Function 抓各家官方 statuspage 的 `summary.json`，10 分钟缓存；某家接口失败时显示“状态未知”，不写成正常。
- Whois：Function 经 rdap.org 转到各注册局 RDAP；某后缀无 RDAP 端点时如实报错。传统 Whois 43 端口在无服务器环境下做不了，已在页面说明。
- 新闻：Function 抓公开 RSS（OpenAI 博客、Anthropic 新闻、Google AI 博客），按标题关键词归类；源变更或被拦截时显示空状态，不编造新闻。想换源，改 `functions/api/news.js` 与 `api/news.js` 里的 `FEEDS` 即可。
- 全球 Ping 的边缘近似：Function 从边缘节点做一次 HTTP HEAD 计时，是单节点近似，不是 ICMP。

### 诚实边界：这三处目前是“近似 + 留钩子”，不要对外宣称已全量实现
1. **逐站出口 IP（分流表里的 IP 列）**：浏览器看不到每个网站背后的出口 IP。本页 IP 列目前填的是你自己的当前 IP 做示例，并用延迟差异推断路由。要逐站真实出口 IP，需要在你自己的出口服务器上做探测，或让 Function 所在的边缘节点按不同路由探测——那需要你自己的代理出口，不是免费接口能给的。
2. **全球 20 节点 ICMP Ping**：浏览器和单边缘节点都做不到从上海、香港、东京等 20 个节点发 ICMP。已实现：浏览器 3 次 min/avg/max、节点表（未接入时统一显示“未接入”）、`PING_API_URL` 钩子。接通真实节点或付费 Ping API 后，把该 API 的返回格式对齐到 `functions/api/ping.js` / `api/ping.js` 的钩子分支，节点表即可填真实数据。不要在未接通前手动填数字。
3. **权威 DNS 泄露检测**：真正看到系统 DNS 出口，需要自建权威 DNS + 唯一子域名并记录查询来源。本站浏览器版只能测公共 DoH 解析器与出口地区对比，并给出自查指南；权威 DNS 探针需另行部署（域名 + DNS 服务器 + 记录日志的后端），README 不假装浏览器版已经做到了。
4. **商业 IP 情报（IPinfo / ipapi.is / AbuseIPDB / DNSBL 全量）**：未接入时，滥用、黑名单、Tor 等项只写“未见信号 / 无法判定”，不写“干净”。接入后见下表。

## 可选环境变量（都不填也能跑核心功能）

| 变量 | 作用 | 不填时 |
|---|---|---|
| `IPINFO_TOKEN` | `/api/ip` 优先走 ipinfo.io，提高地理/ASN 准确度 | 走免费 ip-api.com |
| `PING_API_URL` | `/api/ping` 转发到真实多节点 Ping API（需该 API 接受 `?target=` 并返回节点 min/avg/max） | 只返回边缘单节点 HTTP 延迟 |
| Turnstile sitekey | Cloudflare 页实测人机验证 | 只显示“未配置 sitekey”占位，不伪造通过 |

另：Cloudflare 测速页的演示下载量是 50 MB（代码里 `__down?bytes=50000000`），完整版 300 MB 需把该数字改成 300000000；页面已写明“最多约 350 MB、需手动确认、手机流量勿点”，不要去掉这段警告。

## 上线前你需要自己提供

- [ ] 域名（建议 `ip.你的域名` 做工具站；首页品牌目前是通用“IP 工具”，改 `assets` 之外的各页 `<div class="logo">` 即可换名）
- [ ] Git 仓库 + Pages 或 Vercel 二选一部署（不要两个平台同时指向同一域名）
- [ ] 可选：`IPINFO_TOKEN`（想要更准的商业 IP 数据时）、`PING_API_URL`（想要真实全球 Ping 时）、Turnstile sitekey（想要 Cloudflare 人机实测时）
- [ ] 不需要：登录系统、数据库、付费墙、用户数据收集——本站刻意都没有

## 文件结构

```
index.html  claude.html  ip.html  gpt.html  link.html  dns.html  webrtc.html
cloudflare.html  ping.html  status.html  whois.html  news.html
card/index.html
assets/style.css  assets/app.js
functions/api/{status,whois,news,ping,ip}.js   # Cloudflare Pages
api/{status,whois,news,ping,ip}.js             # Vercel
README.md
```
