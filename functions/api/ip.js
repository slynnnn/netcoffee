// Pages Function: GET /api/ip?ip= — optional commercial IP data, free fallback.
// Env (optional): IPINFO_TOKEN — if set, ipinfo.io is tried first. Without it, ip-api.com is used.
// Never log queries; this function returns data only to the caller.
export async function onRequest(context){
  const ip=new URL(context.request.url).searchParams.get('ip')||'';
  const token=context.env&&context.env.IPINFO_TOKEN;
  if(token){try{const r=await fetch('https://ipinfo.io/'+encodeURIComponent(ip)+'?token='+token);if(r.ok){const j=await r.json();return new Response(JSON.stringify({ip:j.ip,country:j.country,region:j.region,city:j.city,isp:j.org,org:j.org,asn:'',source:'ipinfo.io (commercial, via env token)'}),{headers:{'Content-Type':'application/json'}});}}catch(e){}}
  try{const r=await fetch('https://ip-api.com/json/'+encodeURIComponent(ip)+'?fields=status,country,regionName,city,isp,org,as,query,proxy,hosting,mobile');const j=await r.json();return new Response(JSON.stringify({ip:j.query,country:j.country,region:j.regionName,city:j.city,isp:j.isp,org:j.org,asn:j.as,proxy:j.proxy,hosting:j.hosting,mobile:j.mobile,source:'ip-api.com (free)'}),{headers:{'Content-Type':'application/json'}});}
  catch(e){return new Response(JSON.stringify({error:'IP lookup failed'}),{status:502,headers:{'Content-Type':'application/json'}});}
}
