
function createLiveBoard(canvas, options={}){
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  const rows=12,pegR=6,ballR=11,topY=135,rowGap=43,slotTop=702,slots=11,slotW=W/slots;
  const pegWallMargin=24,pegGap=(W-(pegWallMargin*2))/12;
  let pegs=[],balls=[],prizes=[100,250,500,1000,2500,5000,2500,1000,500,250,100];

  for(let r=0;r<rows;r++){
    const y=topY+r*rowGap;
    if(r%2===0){
      for(let i=0;i<=12;i++)pegs.push({x:pegWallMargin+i*pegGap,y});
    }else{
      for(let i=0;i<12;i++)pegs.push({x:pegWallMargin+pegGap/2+i*pegGap,y});
      pegs.push({x:pegWallMargin,y},{x:W-pegWallMargin,y});
    }
  }

  function money(n){return "$"+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}

  function collide(b,cx,cy,r,bounce=.62){
    const dx=b.x-cx,dy=b.y-cy,min=ballR+r,d2=dx*dx+dy*dy;
    if(d2>=min*min||d2<.0001)return false;
    const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,o=min-d;
    b.x+=nx*o;b.y+=ny*o;
    const rel=b.vx*nx+b.vy*ny;
    if(rel<0){b.vx-=(1+bounce)*rel*nx;b.vy-=(1+bounce)*rel*ny}
    return true;
  }

  function addDrop(drop){
    if(balls.some(b=>b.id===drop.id))return;
    const normalized=Math.max(0,Math.min(1,Number(drop.start_x??.5)));
    const left=pegWallMargin+ballR+4,right=W-left;
    balls.push({
      id:drop.id,
      x:left+normalized*(right-left),
      y:55,
      vx:(Math.random()-.5)*.7,
      vy:.15,
      active:true,
      settleFrames:0,
      player:drop.player_name||"Player",
      officialSettled:!!drop.settled,
      officialSlot:drop.slot,
      officialPrize:drop.prize,
      born:Date.now()
    });
  }

  function updateDrop(drop){
    const b=balls.find(x=>x.id===drop.id);
    if(!b){addDrop(drop);return}
    b.officialSettled=!!drop.settled;
    b.officialSlot=drop.slot;
    b.officialPrize=drop.prize;
  }

  function sync(drops,newPrizes){
    if(Array.isArray(newPrizes)&&newPrizes.length===11)prizes=newPrizes.map(Number);
    for(const d of drops||[]) updateDrop(d);
  }

  function physics(){
    for(const b of balls){
      if(!b.active)continue;
      b.vy+=.285;b.vx*=.9985;b.x+=b.vx;b.y+=b.vy;

      const left=pegWallMargin-8,right=W-pegWallMargin+8;
      if(b.x-ballR<left){b.x=left+ballR;b.vx=Math.abs(b.vx)*.68}
      if(b.x+ballR>right){b.x=right-ballR;b.vx=-Math.abs(b.vx)*.68}

      for(const p of pegs)if(collide(b,p.x,p.y,pegR,.58))b.vx+=(Math.random()-.5)*.16;

      if(b.y>slotTop-42){
        for(let i=1;i<slots;i++){
          const x=i*slotW;collide(b,x,slotTop+2,6,.72);
          if(b.y+ballR>slotTop+4&&b.y-ballR<H-25){
            const dx=b.x-x;
            if(Math.abs(dx)<ballR+2){
              b.x=x+(dx<0?-(ballR+2):(ballR+2));
              b.vx=(dx<0?-1:1)*Math.max(.35,Math.abs(b.vx)*.62);
              if(b.vy>1.2&&b.y<slotTop+32)b.vy*=-.18;
            }
          }
        }
      }

      const floor=H-35;
      if(b.y+ballR>=floor){
        b.y=floor-ballR;
        if(Math.abs(b.vy)>.9){b.vy=-Math.abs(b.vy)*.28;b.vx*=.88}
        else{b.vy=0;b.vx*=.90}

        if(Math.abs(b.vx)<.16&&Math.abs(b.vy)<.16)b.settleFrames++;
        else b.settleFrames=0;

        if(b.settleFrames>16){
          b.active=false;
          // Once the database has the official result, park the host replay in that slot.
          if(b.officialSettled && Number.isInteger(Number(b.officialSlot))){
            b.x=(Number(b.officialSlot)+.5)*slotW;
          }
          setTimeout(()=>{balls=balls.filter(x=>x.id!==b.id)},2200);
        }
      }else b.settleFrames=0;
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,"#12183d");bg.addColorStop(1,"#070a18");
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    ctx.strokeStyle="#dce6ff66";ctx.lineWidth=4;ctx.beginPath();
    ctx.moveTo(pegWallMargin-8,topY-26);ctx.lineTo(pegWallMargin-8,slotTop+5);
    ctx.moveTo(W-pegWallMargin+8,topY-26);ctx.lineTo(W-pegWallMargin+8,slotTop+5);
    ctx.stroke();ctx.lineWidth=1;

    for(const p of pegs){
      ctx.beginPath();ctx.arc(p.x,p.y,pegR,0,Math.PI*2);
      ctx.fillStyle="#eaf0ff";ctx.shadowColor="#9eb8ff";ctx.shadowBlur=7;ctx.fill();ctx.shadowBlur=0;
    }

    for(let i=0;i<slots;i++){
      const x=i*slotW,pr=Number(prizes[i]||0);
      ctx.fillStyle=pr>=2500?"#ffd84a33":pr>=1000?"#74a7ff20":"#ffffff10";
      ctx.fillRect(x+3,slotTop+8,slotW-6,70);
      ctx.fillStyle=pr>=2500?"#ffe36b":"#fff";
      ctx.font="900 15px system-ui";ctx.textAlign="center";
      ctx.fillText(money(pr),x+slotW/2,slotTop+39);
    }

    for(let i=0;i<=slots;i++){
      const x=i*slotW;ctx.fillStyle="#ffffff55";ctx.fillRect(x-1.5,slotTop+4,3,H-slotTop-4);
      if(i>0&&i<slots){ctx.beginPath();ctx.arc(x,slotTop+2,6,0,Math.PI*2);ctx.fillStyle="#dce6ff";ctx.fill()}
    }

    for(const b of balls){
      ctx.beginPath();ctx.arc(b.x,b.y,ballR,0,Math.PI*2);
      ctx.fillStyle="#ffd84a";ctx.shadowColor="#ffd84a";ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle="#fff";ctx.font="800 11px system-ui";ctx.textAlign="center";
      ctx.fillText(b.player,b.x,Math.max(16,b.y-18));
    }
  }

  function loop(){physics();draw();requestAnimationFrame(loop)}
  loop();
  return {sync};
}
