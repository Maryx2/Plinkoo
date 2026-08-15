
// Shared deterministic PLINKO physics.
// Host and player both use exactly this implementation.
window.HighNotesPlinkoPhysics = (() => {
  const CONFIG = {
    W:760,H:820,rows:12,pegR:6,ballR:11,topY:135,rowGap:43,
    slotTop:702,slots:11,pegWallMargin:24
  };
  CONFIG.slotW=CONFIG.W/CONFIG.slots;
  CONFIG.pegGap=(CONFIG.W-(CONFIG.pegWallMargin*2))/12;
  CONFIG.dropMinX=CONFIG.pegWallMargin+CONFIG.ballR+4;
  CONFIG.dropMaxX=CONFIG.W-CONFIG.dropMinX;

  function safeNum(v,fallback=0){
    const n=Number(v);
    return Number.isFinite(n)?n:fallback;
  }

  const pegs=[];
  for(let r=0;r<CONFIG.rows;r++){
    const y=CONFIG.topY+r*CONFIG.rowGap;
    if(r%2===0){
      for(let i=0;i<=12;i++)pegs.push({x:CONFIG.pegWallMargin+i*CONFIG.pegGap,y});
    }else{
      for(let i=0;i<12;i++)pegs.push({x:CONFIG.pegWallMargin+CONFIG.pegGap/2+i*CONFIG.pegGap,y});
      pegs.push({x:CONFIG.pegWallMargin,y},{x:CONFIG.W-CONFIG.pegWallMargin,y});
    }
  }

  function rng(seed){
    let s=(Number(seed)||1)>>>0;
    return ()=>{
      s=(Math.imul(1664525,s)+1013904223)>>>0;
      return s/4294967296;
    };
  }

  function makeBall({id,startX,seed,startedAt,player}){
    const rand=rng(seed);
    const norm=Math.max(0,Math.min(1,Number(startX??.5)));
    const x=CONFIG.dropMinX+norm*(CONFIG.dropMaxX-CONFIG.dropMinX);
    return {
      id,
      x,y:55,
      vx:(rand()-.5)*.7,
      vy:.15,
      active:true,
      settleFrames:0,
      rand,
      player:player||"Player",
      startedAtMs:new Date(startedAt||Date.now()).getTime(),
      finished:false,
      slot:null
    };
  }

  function collide(b,cx,cy,r,bounce=.62){
    const {ballR}=CONFIG;
    const dx=b.x-cx,dy=b.y-cy,min=ballR+r,d2=dx*dx+dy*dy;
    if(d2>=min*min||d2<.0001)return false;
    const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,o=min-d;
    b.x+=nx*o;b.y+=ny*o;
    const rel=b.vx*nx+b.vy*ny;
    if(rel<0){b.vx-=(1+bounce)*rel*nx;b.vy-=(1+bounce)*rel*ny}
    return true;
  }

  function step(b){
    if(!b.active)return;
    const C=CONFIG;
    b.vy+=.285;
    b.vx*=.9985;
    b.x+=b.vx;
    b.y+=b.vy;

    const left=C.pegWallMargin-8,right=C.W-C.pegWallMargin+8;
    if(b.x-C.ballR<left){b.x=left+C.ballR;b.vx=Math.abs(b.vx)*.68}
    if(b.x+C.ballR>right){b.x=right-C.ballR;b.vx=-Math.abs(b.vx)*.68}

    for(const p of pegs){
      if(collide(b,p.x,p.y,C.pegR,.58)){
        b.vx+=(b.rand()-.5)*.16;
      }
    }

    if(b.y>C.slotTop-42){
      for(let i=1;i<C.slots;i++){
        const x=i*C.slotW;
        collide(b,x,C.slotTop+2,6,.72);
        if(b.y+C.ballR>C.slotTop+4&&b.y-C.ballR<C.H-25){
          const dx=b.x-x;
          if(Math.abs(dx)<C.ballR+2){
            b.x=x+(dx<0?-(C.ballR+2):(C.ballR+2));
            b.vx=(dx<0?-1:1)*Math.max(.35,Math.abs(b.vx)*.62);
            if(b.vy>1.2&&b.y<C.slotTop+32)b.vy*=-.18;
          }
        }
      }
    }

    const floor=C.H-35;
    if(b.y+C.ballR>=floor){
      b.y=floor-C.ballR;
      if(Math.abs(b.vy)>.9){b.vy=-Math.abs(b.vy)*.28;b.vx*=.88}
      else{b.vy=0;b.vx*=.90}

      if(Math.abs(b.vx)<.16&&Math.abs(b.vy)<.16)b.settleFrames++;
      else b.settleFrames=0;

      if(b.settleFrames>16){
        b.active=false;
        b.finished=true;
        b.finishedAt=Date.now();
        b.slot=Math.max(0,Math.min(C.slots-1,Math.floor(b.x/C.slotW)));
      }
    }else b.settleFrames=0;
  }

  // Physics runs at the same fixed 60 Hz timeline everywhere.
  function catchUpToNow(b,maxSteps=1000){
    const elapsed=Math.max(0,Date.now()-b.startedAtMs);
    const targetFrames=Math.min(maxSteps,Math.floor(elapsed/(1000/60)));
    for(let i=0;i<targetFrames && b.active;i++)step(b);
    b.framesSimulated=targetFrames;
  }

  function advanceRealTime(b){
    if(!b.active)return;
    const elapsed=Math.max(0,Date.now()-b.startedAtMs);
    const target=Math.floor(elapsed/(1000/60));
    const current=b.framesSimulated||0;
    const todo=Math.min(12,Math.max(0,target-current));
    for(let i=0;i<todo&&b.active;i++)step(b);
    b.framesSimulated=current+todo;
  }

  function drawBoard(ctx,balls,prizes){
    const C=CONFIG;
    ctx.clearRect(0,0,C.W,C.H);
    const bg=ctx.createLinearGradient(0,0,0,C.H);
    bg.addColorStop(0,"#12183d");bg.addColorStop(1,"#070a18");
    ctx.fillStyle=bg;ctx.fillRect(0,0,C.W,C.H);

    ctx.strokeStyle="#dce6ff66";ctx.lineWidth=4;ctx.beginPath();
    ctx.moveTo(C.pegWallMargin-8,C.topY-26);ctx.lineTo(C.pegWallMargin-8,C.slotTop+5);
    ctx.moveTo(C.W-C.pegWallMargin+8,C.topY-26);ctx.lineTo(C.W-C.pegWallMargin+8,C.slotTop+5);
    ctx.stroke();ctx.lineWidth=1;

    for(const p of pegs){
      ctx.beginPath();ctx.arc(p.x,p.y,C.pegR,0,Math.PI*2);
      ctx.fillStyle="#eaf0ff";ctx.shadowColor="#9eb8ff";ctx.shadowBlur=7;ctx.fill();ctx.shadowBlur=0;
    }

    const vals=Array.isArray(prizes)&&prizes.length===11
      ? prizes.map(v=>safeNum(v,0))
      : [0.2,0.5,1,2,5,10,5,2,1,0.5,0.2];
    for(let i=0;i<C.slots;i++){
      const x=i*C.slotW,m=safeNum(vals[i],0);
      ctx.fillStyle=m>=10?"#ffd84a33":m>=2?"#74a7ff20":m<1?"#ff667d18":"#ffffff10";
      ctx.fillRect(x+3,C.slotTop+8,C.slotW-6,70);
      ctx.fillStyle=m>=10?"#ffe36b":m<1?"#ff8fa0":"#fff";
      ctx.font="900 17px system-ui";ctx.textAlign="center";
      ctx.fillText((Number.isInteger(m)?String(m):String(Math.round(m*100)/100))+"×",x+C.slotW/2,C.slotTop+39);
    }

    for(let i=0;i<=C.slots;i++){
      const x=i*C.slotW;
      ctx.fillStyle="#ffffff55";
      ctx.fillRect(x-1.5,C.slotTop+4,3,C.H-C.slotTop-4);
      if(i>0&&i<C.slots){
        ctx.beginPath();ctx.arc(x,C.slotTop+2,6,0,Math.PI*2);
        ctx.fillStyle="#dce6ff";ctx.fill();
      }
    }

    for(const b of balls){
      // Once a ball has fully stopped, leave it visible for 1.8 seconds,
      // then fade it during the final 0.7 seconds before removal.
      let alpha=1;
      if(b.finishedAt){
        const age=Date.now()-b.finishedAt;
        if(age>1800) alpha=Math.max(0,1-((age-1800)/700));
      }

      ctx.save();
      ctx.globalAlpha=alpha;
      ctx.beginPath();ctx.arc(b.x,b.y,C.ballR,0,Math.PI*2);
      ctx.fillStyle="#ffd84a";ctx.shadowColor="#ffd84a";ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;
      if(b.player){
        ctx.fillStyle="#fff";ctx.font="800 11px system-ui";ctx.textAlign="center";
        ctx.fillText(b.player,b.x,Math.max(16,b.y-18));
      }
      ctx.restore();
    }
  }

  return {CONFIG,makeBall,step,catchUpToNow,advanceRealTime,drawBoard};
})();
