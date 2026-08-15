import {json,body,requireHost,sb} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req),s=await requireHost(b.code,b.adminToken);
    const rows=await sb(`plinko_players?id=eq.${encodeURIComponent(b.playerId)}&show_id=eq.${s.id}&select=*`);const p=rows?.[0];if(!p)throw new Error("Player not found.");
    const patch={};
    if(b.ballsDelta!==undefined)patch.balls=Math.max(0,Number(p.balls)+Math.floor(Number(b.ballsDelta)||0));
    if(b.cashDelta!==undefined)patch.cash=Math.max(0,Math.round((Number(p.cash)+Number(b.cashDelta||0))*100)/100);
    await sb(`plinko_players?id=eq.${p.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
    return json({ok:true});
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/host-player"};