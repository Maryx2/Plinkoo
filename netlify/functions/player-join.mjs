import {json,body,cleanName,code,token,showByCode,sb} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req),showCode=code(b.code),name=cleanName(b.name,24);if(!name)throw new Error("Enter your name.");
    const s=await showByCode(showCode);if(!s)throw new Error("Room not found.");
    const nameKey=name.toLowerCase();
    let rows=await sb(`plinko_players?show_id=eq.${s.id}&name_key=eq.${encodeURIComponent(nameKey)}&select=*`);
    let p=rows?.[0];
    if(!p){
      const playerToken=token();
      rows=await sb("plinko_players",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({show_id:s.id,name,name_key:nameKey,player_token:playerToken,balls:s.starting_balls})});
      p=rows[0];
    }
    return json({code:s.code,playerToken:p.player_token});
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/player-join"};