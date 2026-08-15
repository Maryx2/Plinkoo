import {json,body,rpc} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req);
    const startX=Math.max(0,Math.min(1,Number(b.startX)||0.5));
    const result=await rpc("plinko_start_drop",{
      p_player_token:String(b.playerToken||""),
      p_show_code:String(b.code||""),
      p_start_x:startX
    });
    return json(result);
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/player-drop"};