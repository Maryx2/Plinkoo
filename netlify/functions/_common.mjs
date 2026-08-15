import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
}
export async function body(req){try{return await req.json()}catch{return {}}}
export function cleanName(v,max=40){return String(v??"").trim().replace(/\s+/g," ").slice(0,max)}
export function code(v){return String(v??"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6)}
export function token(){return crypto.randomBytes(24).toString("base64url")}
export function pinHash(pin){return crypto.createHash("sha256").update(String(pin)).digest("hex")}
export function randomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<6;i++)s+=chars[crypto.randomInt(chars.length)];return s}

function ensureEnv(){if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw new Error("Supabase environment variables are not configured.")}
export async function sb(path,opts={}){
  ensureEnv();
  const r=await fetch(SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/"+path,{
    ...opts,
    headers:{
      apikey:SUPABASE_SECRET_KEY,
      Authorization:`Bearer ${SUPABASE_SECRET_KEY}`,
      "content-type":"application/json",
      ...(opts.headers||{})
    }
  });
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok)throw new Error(data?.message||data?.hint||data?.details||`Database request failed (${r.status})`);
  return data;
}
export async function rpc(name,args){
  return sb("rpc/"+name,{method:"POST",body:JSON.stringify(args)});
}
export async function showByCode(showCode){
  const rows=await sb(`plinko_shows?code=eq.${encodeURIComponent(code(showCode))}&select=*`);
  return rows?.[0]||null;
}
export async function requireHost(showCode,adminToken){
  const rows=await sb(`plinko_shows?code=eq.${encodeURIComponent(code(showCode))}&admin_token=eq.${encodeURIComponent(String(adminToken||""))}&select=*`);
  if(!rows?.[0])throw new Error("Not authorized for this show.");
  return rows[0];
}
