import {json,body,code,showByCode,sb} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req),s=await showByCode(code(b.code));if(!s)throw new Error("Room not found.");
    const rows=await sb(`plinko_players?show_id=eq.${s.id}&player_token=eq.${encodeURIComponent(String(b.playerToken||""))}&select=id,name,balls,cash,drops`);
    if(!rows?.[0])throw new Error("Player session not found.");
    return json({show:{name:s.name,code:s.code,ball_value:Number.isFinite(Number(s.ball_value))?Number(s.ball_value):100,prizes:s.prizes},player:rows[0]});
  }catch(e){return json({error:e.message},403)}
};
export const config={path:"/api/player-state"};