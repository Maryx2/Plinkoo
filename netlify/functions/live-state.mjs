import {json,body,code,showByCode,sb} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req);
    const s=await showByCode(code(b.code));
    if(!s)throw new Error("Room not found.");

    const players=await sb(
      `plinko_players?show_id=eq.${s.id}&select=id,name,balls,cash,drops&order=cash.desc`
    );

    const drops=await sb(
      `plinko_drops?show_id=eq.${s.id}`+
      `&select=id,player_id,settled,slot,prize,start_x,started_at`+
      `&order=started_at.desc&limit=12`
    );

    const names=Object.fromEntries(players.map(p=>[p.id,p.name]));
    const liveDrops=drops.map(d=>({
      ...d,
      player_name:names[d.player_id]||"Player"
    }));

    return json({
      show:{name:s.name,code:s.code,prizes:s.prizes},
      players,
      drops:liveDrops
    });
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/live-state"};