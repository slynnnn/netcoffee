module.exports = async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.status(400).json({ error: 'missing q' });
  let url = '';
  if (/^AS\d+$/i.test(q)) url = 'https://rdap.org/autnum/' + q.replace(/^AS/i, '');
  else if (/^\d+\.\d+\.\d+\.\d+$/.test(q) || q.includes(':')) url = 'https://rdap.org/ip/' + encodeURIComponent(q);
  else url = 'https://rdap.org/domain/' + encodeURIComponent(q);
  try { const r = await fetch(url, { headers: { Accept: 'application/rdap+json' } }); if (!r.ok) throw new Error('rdap ' + r.status); const j = await r.json(); res.setHeader('Cache-Control', 'public, max-age=300'); return res.json({ source: 'rdap.org', raw: j }); }
  catch (e) { return res.status(502).json({ error: 'RDAP endpoint not found or blocked; traditional WHOIS port 43 needs a backend TCP client (see README)', source: 'rdap.org' }); }
};
