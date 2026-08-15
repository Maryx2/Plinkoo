import {json,body,rpc} from "./_common.mjs";
export default async req=>{
  try{
    const b=await body(req),slot=Math.floor(Number(b.slot));
    const result=await rpc("plinko_settle_drop",{p_player_token:String(b.playerToken||""),p_show_code:String(b.code||""),p_drop_id:String(b.dropId||""),p_slot:slot});
    return json(result);
  }catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/player-settle"};