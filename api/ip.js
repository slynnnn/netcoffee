module.exports = async (req, res) => {
  const ip = req.query.ip || '';
  const token = process.env.IPINFO_TOKEN;
  if (token) { try { const r = await fetch('https://ipinfo.io/' + encodeURIComponent(ip) + '?token=' + token); if (r.ok) { const j = await r.json(); return res.json({ ip: j.ip, country: j.country, region: j.region, city: j.city, isp: j.org, org: j.org, asn: '', source: 'ipinfo.io (commercial, via env token)' }); } } catch (e) {} }
  try { const r = await fetch('https://ip-api.com/json/' + encodeURIComponent(ip) + '?fields=status,country,regionName,city,isp,org,as,query,proxy,hosting,mobile'); const j = await r.json(); return res.json({ ip: j.query, country: j.country, region: j.regionName, city: j.city, isp: j.isp, org: j.org, asn: j.as, proxy: j.proxy, hosting: j.hosting, mobile: j.mobile, source: 'ip-api.com (free)' }); }
  catch (e) { return res.status(502).json({ error: 'IP lookup failed' }); }
};
