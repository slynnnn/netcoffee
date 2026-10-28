// Vercel Function: GET /api/status — same logic as functions/api/status.js (Pages).
const SERVICES=[
 ['Claude (Anthropic)','AI','https://status.anthropic.com/api/v2/summary.json'],
 ['OpenAI / ChatGPT','AI','https://status.openai.com/api/v2/summary.json'],
 ['Cursor','AI','https://status.cursor.com/api/v2/summary.json'],
 ['Grok / xAI','AI','https://status.x.ai/api/v2/summary.json'],
 ['Groq','AI','https://status.groq.com/api/v2/summary.json'],
 ['ElevenLabs','AI','https://status.elevenlabs.io/api/v2/summary.json'],
 ['Perplexity','AI','https://status.perplexity.ai/api/v2/summary.json'],
 ['Replicate','AI','https://status.replicate.com/api/v2/summary.json'],
 ['Cloudflare','云服务','https://www.cloudflarestatus.com/api/v2/summary.json'],
 ['Vercel','云服务','https://www.vercel-status.com/api/v2/summary.json'],
 ['Netlify','云服务','https://www.netlifystatus.com/api/v2/summary.json'],
 ['DigitalOcean','云服务','https://status.digitalocean.com/api/v2/summary.json'],
 ['Supabase','云服务','https://status.supabase.com/api/v2/summary.json'],
 ['Fly.io','云服务','https://status.fly.io/api/v2/summary.json'],
 ['GitHub','开发','https://www.githubstatus.com/api/v2/summary.json'],
 ['npm','开发','https://status.npmjs.org/api/v2/summary.json'],
 ['Stripe','开发','https://status.stripe.com/api/v2/summary.json'],
 ['Notion','开发','https://status.notion.so/api/v2/summary.json'],
 ['Figma','开发','https://status.figma.com/api/v2/summary.json'],
 ['Sentry','开发','https://status.sentry.io/api/v2/summary.json'],
 ['Postman','开发','https://status.postman.com/api/v2/summary.json'],
 ['Atlassian / Jira','开发','https://status.atlassian.com/api/v2/summary.json'],
 ['Twilio','开发','https://status.twilio.com/api/v2/summary.json'],
 ['Clerk','开发','https://status.clerk.com/api/v2/summary.json'],
 ['SendGrid','开发','https://status.sendgrid.com/api/v2/summary.json'],
 ['Python / PyPI','开发','https://status.python.org/api/v2/summary.json'],
 ['Discord','社区','https://discordstatus.com/api/v2/summary.json'],
 ['Reddit','社区','https://www.redditstatus.com/api/v2/summary.json'],
 ['Zoom','社区','https://status.zoom.us/api/v2/summary.json'],
 ['Twitch','社区','https://status.twitch.tv/api/v2/summary.json'],
 ['Pinterest','社区','https://status.pinterest.com/api/v2/summary.json'],
];
module.exports = async (req, res) => {
  const out = [];
  await Promise.all(SERVICES.map(async ([name, cat, url]) => {
    try { const c = new AbortController(); setTimeout(() => c.abort(), 6000); const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error('http'); const j = await r.json(); const inc = (j.incidents || [])[0]; out.push({ name, category: cat, status: j.status?.indicator || 'unknown', incident: inc ? inc.name : '', page: url.replace('/api/v2/summary.json', '') }); }
    catch (e) { out.push({ name, category: cat, status: 'unknown', incident: '', page: url.replace('/api/v2/summary.json', '') }); }
  }));
  const ordered = SERVICES.map(([n]) => out.find(x => x.name === n)).filter(Boolean);
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.json({ updated: new Date().toISOString(), services: ordered });
};
