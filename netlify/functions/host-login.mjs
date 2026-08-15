import {json,body,code,pinHash,showByCode} from "./_common.mjs";
export default async req=>{
  try{const b=await body(req),s=await showByCode(b.code);if(!s||s.pin_hash!==pinHash(b.pin||""))return json({error:"Wrong room code or host PIN."},403);return json({code:s.code,adminToken:s.admin_token})}
  catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/host-login"};