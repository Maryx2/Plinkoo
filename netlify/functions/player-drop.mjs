import {json,body,rpc} from "./_common.mjs";
export default async req=>{
  try{const b=await body(req),result=await rpc("plinko_start_drop",{p_player_token:String(b.playerToken||""),p_show_code:String(b.code||"")});return json(result)}
  catch(e){return json({error:e.message},400)}
};
export const config={path:"/api/player-drop"};