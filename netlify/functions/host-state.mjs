import {json,body,requireHost,sb} from "./_common.mjs";

export default async req=>{
  try{
    const b=await body(req);
    const s=await requireHost(b.code,b.adminToken);

    const players=await sb(
      `plinko_players?show_id=eq.${s.id}`+
      `&select=id,name,name_key,balls,cash,drops,created_at&order=created_at.asc`
    );

    const allPlayers=await sb(`plinko_players?select=name_key,cash`);
    const totals={};

    for(const p of allPlayers){
      const k=String(p.name_key||"");
      totals[k]=(totals[k]||0)+Number(p.cash||0);
    }

    const enriched=players.map(p=>({
      ...p,
      session_cash:Number(p.cash||0),
      total_cash:Math.round((totals[p.name_key]||0)*100)/100
    }));

    return json({
      show:{
        name:s.name,
        code:s.code,
        starting_balls:s.starting_balls,
        prizes:s.prizes
      },
      players:enriched
    });
  }catch(e){
    return json({error:e.message},403);
  }
};

export const config={path:"/api/host-state"};