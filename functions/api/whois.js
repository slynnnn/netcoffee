// Pages Function: GET /api/whois?q=domain|IP|AS123 — RDAP-first via rdap.org.
export async function onRequest(context){
  const q=new URL(context.request.url).searchParams.get('q')||'';
  if(!q)return new Response(JSON.stringify({error:'missing q'}),{status:400,headers:{'Content-Type':'application/json'}});
  let url='';
  if(/^AS\d+$/i.test(q))url='https://rdap.org/autnum/'+q.replace(/^AS/i,'');
  else if(/^\d+\.\d+\.\d+\.\d+$/.test(q)||q.includes(':'))url='https://rdap.org/ip/'+encodeURIComponent(q);
  else url='https://rdap.org/domain/'+encodeURIComponent(q);
  try{const r=await fetch(url,{headers:{Accept:'application/rdap+json'}});if(!r.ok)throw new Error('rdap '+r.status);const j=await r.json();return new Response(JSON.stringify({source:'rdap.org',raw:j}),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=300'}});}
  catch(e){return new Response(JSON.stringify({error:'RDAP endpoint not found or blocked; traditional WHOIS port 43 needs a backend TCP client (see README)',source:'rdap.org'}),{status:502,headers:{'Content-Type':'application/json'}});}
}
