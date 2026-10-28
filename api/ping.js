module.exports = async (req, res) => {
  const target = req.query.target || '';
  if (!target) return res.status(400).json({ error: 'missing target' });
  const hook = process.env.PING_API_URL;
  if (hook) { try { const r = await fetch(hook + '?target=' + encodeURIComponent(target)); const t = await r.text(); res.setHeader('Content-Type', 'application/json'); return res.send(t); } catch (e) {} }
  const t0 = Date.now();
  try { const c = new AbortController(); setTimeout(() => c.abort(), 5000); await fetch('https://' + target + '/', { method: 'HEAD', signal: c.signal }); return res.json({ target, edge_ms: Date.now() - t0, source: 'edge HTTP HEAD (single node, not ICMP)' }); }
  catch (e) { return res.json({ target, edge_ms: null, source: 'edge HTTP HEAD (single node, not ICMP)' }); }
};
