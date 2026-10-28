// Pages Function: GET /api/ping?target= — edge HTTP latency approximation + documented hook.
// If env PING_API_URL is set (a real multi-node ping API base URL), proxy to it:
//   PING_API_URL + '?target=' + target  (must return JSON with nodes/min/avg/max)
// Otherwise return single edge-node HTTP timing. Never fabricate node data.
export async function onRequest(context){
  const target=new URL(context.request.url).searchParams.get('target')||'';
  if(!target)return new Response(JSON.stringify({error:'missing target'}),{status:400,headers:{'Content-Type':'application/json'}});
  const hook=context.env&&context.env.PING_API_URL;
  if(hook){try{const r=await fetch(hook+'?target='+encodeURIComponent(target));return new Response(await r.text(),{headers:{'Content-Type':'application/json'}});}catch(e){}}
  const t0=Date.now();
  try{const c=new AbortController();setTimeout(()=>c.abort(),5000);await fetch('https://'+target+'/',{method:'HEAD',signal:c.signal});return new Response(JSON.stringify({target,edge_ms:Date.now()-t0,source:'edge HTTP HEAD (single node, not ICMP)'}),{headers:{'Content-Type':'application/json'}});}
  catch(e){return new Response(JSON.stringify({target,edge_ms:null,source:'edge HTTP HEAD (single node, not ICMP)'}),{headers:{'Content-Type':'application/json'}});}
}
