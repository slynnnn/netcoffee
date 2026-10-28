// Shared helpers for the IP-tools site. No tracking, no server logging.
// Theme: light / dark / system (cycles on click)
(function(){const t=localStorage.getItem('nc-theme')||'system';applyTheme(t);})();
function themeIcon(t){const s='width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';if(t==='dark')return `<svg ${s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;if(t==='light')return `<svg ${s}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;return `<svg ${s}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;}
function applyTheme(t){if(t==='system'){document.documentElement.setAttribute('data-theme',window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}else{document.documentElement.setAttribute('data-theme',t);}localStorage.setItem('nc-theme',t);const b=document.getElementById('themeBtn');if(b){b.innerHTML=themeIcon(t);b.title=t==='dark'?'深色':t==='light'?'浅色':'跟随系统';b.setAttribute('aria-label','切换主题：'+b.title);}}
if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if((localStorage.getItem('nc-theme')||'system')==='system')applyTheme('system');});
function toggleTheme(){const cur=localStorage.getItem('nc-theme')||'system';applyTheme(cur==='system'?'light':cur==='light'?'dark':'system');}
window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('themeBtn');if(b){applyTheme(localStorage.getItem('nc-theme')||'system');b.onclick=toggleTheme;}
const path=(location.pathname.replace(/\/$/,'')||'/index').split('/').pop()||'index';
document.querySelectorAll('nav a').forEach(a=>{const href=a.getAttribute('href')||'';const key=href.replace('.html','').replace('/','')||'index';if(key===path||(path==='index'&&key==='index'))a.classList.add('active');});});
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function maskIP(ip,hide){if(!hide||!ip)return ip||'—';const p=String(ip).split('.');if(p.length===4)return p[0]+'.'+p[1]+'.***.***';return String(ip).slice(0,6)+'***';}
let HIDE=false;
function setHide(v){HIDE=v;document.querySelectorAll('[data-ip]').forEach(el=>{el.textContent=maskIP(el.dataset.raw||el.textContent,HIDE);});}
async function fetchJSON(url,opts={},timeout=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{...opts,signal:c.signal});clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}catch(e){clearTimeout(t);throw e;}}
async function fetchTrace(){try{const r=await fetch('https://www.cloudflare.com/cdn-cgi/trace');const txt=await r.text();const o={};txt.split('\n').forEach(l=>{const [k,v]=l.split('=');if(k)o[k]=v;});return o;}catch(e){return {};}}
// Free IP info, fallback chain. Fields normalised, never claimed to be commercial-grade.
async function getIPInfo(ip){
  const q=ip?('/'+encodeURIComponent(ip)):'';
  const tries=[
    async()=>{const j=await fetchJSON('https://ip-api.com/json'+q+'?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting,mobile');if(j.status!=='success')throw new Error(j.message||'ip-api failed');return {ip:j.query,country:j.country,countryCode:j.countryCode,region:j.regionName,city:j.city,zip:j.zip,lat:j.lat,lon:j.lon,timezone:j.timezone,isp:j.isp,org:j.org,asn:j.as,proxy:!!j.proxy,hosting:!!j.hosting,mobile:!!j.mobile,source:'ip-api.com'};},
    async()=>{const j=await fetchJSON('https://ipapi.co'+q+'/json/');if(j.error)throw new Error('ipapi.co failed');return {ip:j.ip,country:j.country_name,countryCode:j.country_code,region:j.region,city:j.city,zip:j.postal,lat:j.latitude,lon:j.longitude,timezone:j.timezone,isp:j.org,org:j.org,asn:j.asn,proxy:false,hosting:false,mobile:false,source:'ipapi.co'};}
  ];
  for(const fn of tries){try{return await fn();}catch(e){}}
  const tr=await fetchTrace();return {ip:tr.ip||ip||'',country:'',city:'',isp:'',org:'',asn:'',timezone:'',proxy:false,hosting:false,mobile:false,source:tr.ip?'Cloudflare trace（仅 IP/节点）':'未知',trace:tr};
}
// Heuristic score, explained in-page. NOT a commercial trust score.
function heuristicScore(info){
  let s=75;const reasons=[];
  if(info.hosting){s-=30;reasons.push('机房/托管 IP（-30）');}
  if(info.proxy){s-=20;reasons.push('检测为代理（-20）');}
  if(info.mobile){s+=5;reasons.push('移动网络（+5）');}
  if(!info.hosting&&!info.proxy){s+=10;reasons.push('非机房/非代理特征（+10）');}
  if(info.tor){s-=40;reasons.push('Tor 出口（-40）');}
  return {score:Math.max(0,Math.min(100,s)),reasons};
}
function scoreBadge(s){return s>=70?'<span class="badge ok">可信</span>':s>=50?'<span class="badge warn">一般</span>':'<span class="badge bad">高风险</span>';}
function gaugeHTML(s){return `<div class="gauge"><i style="width:${s}%"></i></div><div class="small">0 高危 &nbsp; 25 &nbsp; 50 &nbsp; 75 &nbsp; 100 可信</div>`;}
function deviceInfo(){
  let gl='未知';try{const c=document.createElement('canvas');const g=c.getContext('webgl');const ext=g&&g.getExtension('WEBGL_debug_renderer_info');gl=ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):(g?g.getParameter(g.RENDERER):'未知');}catch(e){}
  let canvasHash='—';try{const c=document.createElement('canvas');const g=c.getContext('2d');g.textBaseline='top';g.font='14px Arial';g.fillText('netcoffee-fingerprint-check',2,2);let h=0;const d=c.toDataURL();for(let i=0;i<d.length;i++){h=((h<<5)-h+d.charCodeAt(i))|0;}canvasHash='hash-'+Math.abs(h).toString(16).slice(0,8);}catch(e){}
  return {timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'',language:navigator.language,platform:navigator.platform||navigator.userAgentData?.platform||'',touch:('ontouchstart'in window||navigator.maxTouchPoints>0)?'支持':'不支持',dnt:navigator.doNotTrack||'未设置',webgl:gl,canvas:canvasHash,ua:navigator.userAgent};
}
function saveHistory(tool,entry){try{const k='nc-history-'+tool;const arr=JSON.parse(localStorage.getItem(k)||'[]');arr.unshift({t:new Date().toISOString(),...entry});localStorage.setItem(k,JSON.stringify(arr.slice(0,20)));}catch(e){}}
function loadHistory(tool){try{return JSON.parse(localStorage.getItem('nc-history-'+tool)||'[]');}catch(e){return [];}}
function clearHistory(tool){localStorage.removeItem('nc-history-'+tool);}
function renderHistory(tool,elId){const el=document.getElementById(elId);if(!el)return;const arr=loadHistory(tool);el.innerHTML=arr.length?arr.map(x=>`<div class="small">${esc(new Date(x.t).toLocaleString())} — ${esc(x.ip||'')} ${esc(x.label||'')}</div>`).join(''):'<div class="small">暂无记录。历史只存在你的浏览器本地，本站不记录。</div>';}
async function timedFetch(url,timeout=5000){const t0=performance.now();const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{await fetch(url,{mode:'no-cors',signal:c.signal,cache:'no-store'});clearTimeout(t);return Math.round(performance.now()-t0);}catch(e){clearTimeout(t);return null;}}
function latencyLabel(ms){if(ms===null)return '<span class="badge bad">超时</span>';if(ms<200)return '<span class="badge ok">优 '+ms+'ms</span>';if(ms<500)return '<span class="badge ok">良 '+ms+'ms</span>';if(ms<1000)return '<span class="badge warn">慢 '+ms+'ms</span>';return '<span class="badge bad">很慢 '+ms+'ms</span>';}
// Site lists shared by index + link
const SITES=[
 {name:'Google',domain:'google.com',region:'美国'},{name:'YouTube',domain:'youtube.com',region:'美国'},{name:'GitHub',domain:'github.com',region:'美国'},{name:'Cloudflare',domain:'cloudflare.com',region:'美国'},{name:'OpenAI',domain:'openai.com',region:'美国'},{name:'ChatGPT',domain:'chatgpt.com',region:'美国'},{name:'Claude',domain:'claude.ai',region:'美国'},{name:'Anthropic',domain:'anthropic.com',region:'美国'},{name:'Discord',domain:'discord.com',region:'美国'},{name:'X / Twitter',domain:'x.com',region:'美国'},{name:'Instagram',domain:'instagram.com',region:'美国'},{name:'Facebook',domain:'facebook.com',region:'美国'},{name:'Netflix',domain:'netflix.com',region:'美国'},{name:'Wikipedia',domain:'wikipedia.org',region:'美国'},{name:'Reddit',domain:'reddit.com',region:'美国'},{name:'Telegram',domain:'telegram.org',region:'欧洲'},{name:'Amazon',domain:'amazon.com',region:'美国'},{name:'Apple',domain:'apple.com',region:'美国'},{name:'Microsoft',domain:'microsoft.com',region:'美国'},{name:'Steam',domain:'steampowered.com',region:'美国'},
 {name:'百度',domain:'baidu.com',region:'中国'},{name:'哔哩哔哩',domain:'bilibili.com',region:'中国'},{name:'知乎',domain:'zhihu.com',region:'中国'},{name:'淘宝',domain:'taobao.com',region:'中国'},{name:'京东',domain:'jd.com',region:'中国'},{name:'微博',domain:'weibo.com',region:'中国'},{name:'微信',domain:'weixin.qq.com',region:'中国'},{name:'腾讯',domain:'qq.com',region:'中国'},{name:'阿里云',domain:'aliyun.com',region:'中国'},{name:'网易',domain:'163.com',region:'中国'},
 {name:'Yahoo 日本',domain:'yahoo.co.jp',region:'日本'},{name:'LINE',domain:'line.me',region:'日本'},{name:'Pixiv',domain:'pixiv.net',region:'日本'},{name:'Niconico',domain:'nicovideo.jp',region:'日本'},{name:'BBC',domain:'bbc.com',region:'英国'},{name:'Spotify',domain:'spotify.com',region:'欧洲'},{name:'TikTok',domain:'tiktok.com',region:'国际'},
];
// Extra helpers for v2 specs
async function getBothIPs(){
  const out={v4:'',v6:''};
  try{const j=await fetchJSON('https://api.ipify.org?format=json',{},5000);out.v4=j.ip||'';}catch(e){}
  try{const j=await fetchJSON('https://api64.ipify.org?format=json',{},5000);if(j.ip&&j.ip.includes(':'))out.v6=j.ip;else if(!out.v4)out.v4=j.ip;}catch(e){}
  try{const j=await fetchJSON('https://api6.ipify.org?format=json',{},5000);if(j.ip)out.v6=j.ip;}catch(e){}
  if(!out.v4&&!out.v6){const tr=await fetchTrace();if(tr.ip){if(tr.ip.includes(':'))out.v6=tr.ip;else out.v4=tr.ip;}}
  return out;
}
const COLO={HKG:'香港',NRT:'东京',SIN:'新加坡',LAX:'洛杉矶',SJC:'圣何塞',SFO:'旧金山',SEA:'西雅图',FRA:'法兰克福',AMS:'阿姆斯特丹',CDG:'巴黎',ARN:'斯德哥尔摩',ZRH:'苏黎世',MAD:'马德里',IST:'伊斯坦布尔',DME:'莫斯科',SVO:'莫斯科',BOM:'孟买',TLV:'特拉维夫',SGN:'胡志明市',CGK:'雅加达',ATL:'亚特兰大',YVR:'温哥华',GRU:'圣保罗',LHR:'伦敦',DUB:'都柏林',YYZ:'多伦多',ORD:'芝加哥',DFW:'达拉斯',MIA:'迈阿密',ICN:'首尔',TPE:'台北',BKK:'曼谷',DEL:'德里',JNB:'约翰内斯堡',SYD:'悉尼'};
function coloCity(code){return COLO[code]||('节点 '+code);}
function isBogon(ip){if(!ip)return false;const v=ip.split('.');if(v.length===4){const a=+v[0],b=+v[1];return a===10||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||a===127||a===0;}return ip.startsWith('fc')||ip.startsWith('fd')||ip==='::1';}
async function checkCommonPorts(host){
  // Browser cannot do raw TCP port scans. This checks well-known web endpoints only,
  // and labels everything else as "浏览器无法直接探测", never as open/closed.
  const ports=[{p:80,url:'http://'+host+'/'},{p:443,url:'https://'+host+'/'}];
  const out=[];
  for(const x of ports){const ms=await timedFetch(x.url,4000);out.push({port:x.p,reachable:ms!==null,ms});}
  return out;
}

// ---- v2 helpers: multi-source geo, RDAP, fingerprint rendering, dropdown ----
async function getMultiGeo(ip){
  const out=[];
  try{const j=await fetchJSON('https://ip-api.com/json/'+encodeURIComponent(ip)+'?fields=status,country,regionName,city,lat,lon,isp',{},6000);if(j.status==='success')out.push({source:'ip-api.com',country:j.country,region:j.regionName,city:j.city,lat:j.lat,lon:j.lon,isp:j.isp});}catch(e){}
  try{const j=await fetchJSON('https://ipapi.co/'+encodeURIComponent(ip)+'/json/',{},6000);if(!j.error)out.push({source:'ipapi.co',country:j.country_name,region:j.region,city:j.city,lat:j.latitude,lon:j.longitude,isp:j.org});}catch(e){}
  try{const tr=await fetchTrace();if(tr.ip)out.push({source:'Cloudflare trace',country:'',region:'',city:'',lat:'',lon:'',isp:'',colo:tr.colo,loc:tr.loc});}catch(e){}
  return out;
}
async function fetchRDAP(ip){
  try{const j=await fetchJSON('/api/whois?q='+encodeURIComponent(ip),{},12000);return j.raw||j;}catch(e){}
  try{const j=await fetchJSON('https://rdap.org/ip/'+encodeURIComponent(ip),{},10000);return j;}catch(e){return null;}
}
function browserName(){
  const ua=navigator.userAgent;
  if(/Edg\//.test(ua))return 'Edge'; if(/OPR\//.test(ua))return 'Opera';
  if(/Chrome\//.test(ua))return 'Chrome'; if(/Firefox\//.test(ua))return 'Firefox';
  if(/Safari\//.test(ua))return 'Safari'; return '未知浏览器';
}
function fingerprintHTML(dev){
  const conn=navigator.connection||{};
  return `<div class="kv"><b>时区</b><span>${esc(dev.timezone)}</span><b>语言</b><span>${esc(dev.language)}</span><b>浏览器</b><span>${esc(browserName())}</span><b>操作系统 / 平台</b><span>${esc(dev.platform)}</span><b>触屏</b><span>${esc(dev.touch)}</span><b>网络类型</b><span>${esc(conn.effectiveType||'未知')}${conn.downlink?(' · 约 '+conn.downlink+' Mbps'):''}</span><b>Do Not Track</b><span>${esc(dev.dnt)}</span><b>WebGL 渲染器</b><span>${esc(dev.webgl)}</span><b>Canvas 指纹摘要</b><span>${esc(dev.canvas)}</span></div><p class="small">指纹只在本页即时计算、显示，不上传、不保存到服务器。</p>`;
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('.dropbtn');
  document.querySelectorAll('.dropdown').forEach(d=>{if(!btn||!d.contains(btn))d.classList.remove('open');});
  if(btn){btn.closest('.dropdown').classList.toggle('open');}
});
