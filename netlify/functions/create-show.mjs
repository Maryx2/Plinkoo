import {json,body,cleanName,pinHash,token,randomCode,sb} from "./_common.mjs";
export default async req=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const b=await body(req),name=cleanName(b.name)||"PLINKO! By High Notes",pin=String(b.pin||"");
    if(pin.length<4)throw new Error("Use a host PIN with at least 4 characters.");
    let showCode;
    for(let i=0;i<8;i++){showCode=randomCode();const exists=await sb(`plinko_shows?code=eq.${showCode}&select=id`);if(!exists.length)break}
    const adminToken=token();
    const rows=await sb("plinko_shows",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({code:showCode,name,pin_hash:pinHash(pin),admin_token:adminToken})});
    return json({code:rows[0].code,adminToken});
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/create-show"};