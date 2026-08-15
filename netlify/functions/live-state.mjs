import {json,body,code,showByCode,sb} from "./_common.mjs";

export default async req=>{
  try{
    const b=await body(req);
    const s=await showByCode(code(b.code));
    if(!s)throw new Error("Room not found.");

    const players=await sb(
      `plinko_players?show_id=eq.${s.id}`+
      `&select=id,name,name_key,balls,cash,drops&order=cash.desc`
    );

    // Pull all player rows so we can calculate lifetime totals by normalized name.
    const allPlayers=await sb(
      `plinko_players?select=name_key,cash`
    );

    const totals={};
    for(const p of allPlayers){
      const k=String(p.name_key||"");
      totals[k]=(totals[k]||0)+Number(p.cash||0);
    }

    const enrichedPlayers=players.map(p=>({
      ...p,
      session_cash:Number(p.cash||0),
      total_cash:Math.round((totals[p.name_key]||0)*100)/100
    }));

    // Only send truly recent live drops. This prevents stale balls from being
    // reconstructed when a host refreshes or reconnects later.
    const recentCutoff=new Date(Date.now()-20000).toISOString();

    const drops=await sb(
      `plinko_drops?show_id=eq.${s.id}`+
      `&started_at=gte.${encodeURIComponent(recentCutoff)}`+
      `&select=id,player_id,settled,slot,prize,start_x,started_at,physics_seed`+
      `&order=started_at.asc`
    );

    const names=Object.fromEntries(enrichedPlayers.map(p=>[p.id,p.name]));
    const liveDrops=drops.map(d=>({
      ...d,
      player_name:names[d.player_id]||"Player"
    }));

    return json({
      serverNow:new Date().toISOString(),
      show:{name:s.name,code:s.code,prizes:s.prizes},
      players:enrichedPlayers,
      drops:liveDrops
    });
  }catch(e){
    return json({error:e.message},400);
  }
};

export const config={path:"/api/live-state"};