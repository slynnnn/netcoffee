const FEEDS=[
 ['OpenAI','https://openai.com/blog/rss.xml'],
 ['Anthropic','https://www.anthropic.com/news/rss.xml'],
 ['Google AI','https://blog.google/technology/ai/rss/'],
];
function parse(xml,source){
  const items=[];const blocks=xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/g)||[];
  for(const b of blocks.slice(0,30)){
    const pick=(tag)=>{const m=b.match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)</'+tag+'>'));return m?m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,'').trim():'';};
    const linkM=b.match(/<link[^>]*href="([^"]+)"/);const link=linkM?linkM[1]:pick('link');
    const title=pick('title');if(title&&link)items.push({title,link,date:pick('pubDate')||pick('updated')||'',summary:pick('description')||pick('summary')||'',source});
  }
  return items;
}
module.exports = async (req, res) => {
  let items = [];
  for (const [src, url] of FEEDS) { try { const c = new AbortController(); setTimeout(() => c.abort(), 8000); const r = await fetch(url, { signal: c.signal, headers: { 'User-Agent': 'netcoffee-rss/1.0' } }); if (!r.ok) continue; items.push(...parse(await r.text(), src)); } catch (e) {} }
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.json({ updated: new Date().toISOString(), items: items.slice(0, 100) });
};
