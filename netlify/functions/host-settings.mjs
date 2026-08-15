import {json,body,requireHost,sb} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req),s=await requireHost(b.code,b.adminToken),patch={};
    if(Array.isArray(b.prizes)){if(b.prizes.length!==11)throw new Error("Prize board needs 11 values.");patch.prizes=b.prizes.map(v=>Math.max(0,Number(v)||0))}
    if(b.startingBalls!==undefined)patch.starting_balls=Math.max(0,Math.floor(Number(b.startingBalls)||0));
    await sb(`plinko_shows?id=eq.${s.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
    return json({ok:true});
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/host-settings"};