import {json,body,requireHost,sb} from "./_common.mjs";
export default async req=>{
  try{const b=await body(req),s=await requireHost(b.code,b.adminToken);const players=await sb(`plinko_players?show_id=eq.${s.id}&select=id,name,balls,cash,drops,created_at&order=created_at.asc`);return json({show:{name:s.name,code:s.code,starting_balls:s.starting_balls,prizes:s.prizes},players})}
  catch(e){return json({error:e.message},403)}
};
export const config={path:"/api/host-state"};