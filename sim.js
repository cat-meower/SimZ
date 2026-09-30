const c=document.getElementById("sim"),x=c.getContext("2d");
let people=[],paused=false,infectChance=.12,defence=0,walls=[],roads=[],bullets=[],revived=0;

function hit(a,b){
  return a.x+a.r>b.x&&a.x-a.r<b.x+b.w&&a.y+a.r>b.y&&a.y-a.r<b.y+b.h;
}
function pointInBuilding(p,b){
  return p.x>b.x+5&&p.x<b.x+b.w-5&&p.y>b.y+5&&p.y<b.y+b.h-5;
}
function buildingAt(p){
  return walls.find(w=>pointInBuilding(p,w));
}
function blocked(p,nx,ny){
  if(p.inside)return false;
  const test={x:nx,y:ny,r:p.r};
  return walls.some(w=>hit(test,w));
}

function makeCity(){
  walls=[];roads=[];
  const vertical=[],horizontal=[];
  for(let i=0;i<3;i++)horizontal.push(50+Math.random()*500);
  for(let i=0;i<4;i++)vertical.push(60+Math.random()*780);

  for(const y of horizontal)roads.push({x:0,y,w:c.width,h:30+Math.random()*20});
  for(const xx of vertical)roads.push({x:xx,y:0,w:30+Math.random()*20,h:c.height});

  for(let i=0;i<26;i++){
    let b,tries=0;
    do{
      const w=45+Math.random()*95,h=40+Math.random()*85;
      b={x:15+Math.random()*(c.width-w-30),y:15+Math.random()*(c.height-h-30),w,h};
      tries++;
    }while(tries<150&&(
      roads.some(r=>b.x<r.x+r.w&&b.x+b.w>r.x&&b.y<r.y+r.h&&b.y+b.h>r.y)||
      walls.some(q=>b.x<q.x+q.w+8&&b.x+b.w>q.x-8&&b.y<q.y+q.h+8&&b.y+b.h>q.y-8)
    ));
    b.doorSide=["top","bottom","left","right"][Math.floor(Math.random()*4)];
    b.doorSize=18;
    walls.push(b);
  }
}

function doorPoint(b){
  if(b.doorSide==="top")return{x:b.x+b.w/2,y:b.y-1};
  if(b.doorSide==="bottom")return{x:b.x+b.w/2,y:b.y+b.h+1};
  if(b.doorSide==="left")return{x:b.x-1,y:b.y+b.h/2};
  return{x:b.x+b.w+1,y:b.y+b.h/2};
}
function enterBuilding(p,b){
  const d=doorPoint(b);
  p.x=b.x+b.w/2;
  p.y=b.y+b.h/2;
  p.inside=true;
  p.building=b;
  p.vx=0;p.vy=0;
}
function leaveBuilding(p){
  if(!p.inside)return;
  const b=p.building,d=doorPoint(b);
  p.inside=false;p.building=null;
  p.x=d.x+(b.doorSide==="left"?-p.r-2:b.doorSide==="right"?p.r+2:0);
  p.y=d.y+(b.doorSide==="top"?-p.r-2:b.doorSide==="bottom"?p.r+2:0);
}

function reset(){
  people=[];bullets=[];makeCity();
  const n=+document.getElementById("count").value||45;
  for(let i=0;i<n;i++){
    let p={
      x:15+Math.random()*870,y:15+Math.random()*570,r:8,vx:0,vy:0,
      infected:false,defender:Math.random()<defence,cool:Math.random()*30,
      trait:Math.random()<.6?"scared":null,inside:false,building:null,medic:Math.random()<.12,revives:0
    };
    let tries=0;
    while(walls.some(w=>hit(p,w))&&tries++<500){
      p.x=15+Math.random()*870;p.y=15+Math.random()*570;
    }
    people.push(p);
  }
  if(people.length){
    people[0].infected=true;
    people[0].defender=false; people[0].medic=false;
    people[0].trait=null;
  }
}

function shoot(def,target){
  const dx=target.x-def.x,dy=target.y-def.y,d=Math.hypot(dx,dy)||1;
  if(d>180||def.cool>0)return;
  def.cool=18;
  bullets.push({x:def.x,y:def.y,vx:dx/d*6,vy:dy/d*6,life:35,target});
}

function nearestInfected(p){
  let target=null,md=1e9;
  for(const q of people)if(q.infected&&!q.dead&&!q.inside){
    const d=Math.hypot(q.x-p.x,q.y-p.y);
    if(d<md){md=d;target=q}
  }
  return target;
}
function nearestBuilding(p){
  let target=null,md=1e9;
  for(const b of walls){
    const d=doorPoint(b),dist=Math.hypot(d.x-p.x,d.y-p.y);
    if(dist<md){md=dist;target=b}
  }
  return target;
}

function nearestDead(p){let target=null,md=1e9;for(const q of people)if(q.dead){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<md){md=d;target=q}}return target;}\nfunction step(){
  for(const p of people){
    if(p.cool>0)p.cool--;
    if(p.dead)continue;\n    if(p.medic&&!p.inside&&p.revives<3){const corpse=nearestDead(p);if(corpse){const d=Math.hypot(corpse.x-p.x,corpse.y-p.y);if(d<140){const dx=corpse.x-p.x,dy=corpse.y-p.y,dd=Math.hypot(dx,dy)||1;p.vx+=dx/dd*.08;p.vy+=dy/dd*.08;if(d<18){corpse.dead=false;corpse.infected=true;corpse.defender=false;corpse.medic=false;corpse.trait=null;p.revives++;revived++;}}}}

    // Scared civilians hide inside the nearest building when danger is nearby.
    if(!p.infected&&!p.defender&&p.trait==="scared"&&!p.inside){
      const danger=nearestInfected(p);
      if(danger){
        const dist=Math.hypot(danger.x-p.x,danger.y-p.y);
        if(dist<180){
          const b=nearestBuilding(p),d=doorPoint(b);
          const dx=d.x-p.x,dy=d.y-p.y,dd=Math.hypot(dx,dy)||1;
          p.vx+=dx/dd*.18;p.vy+=dy/dd*.18;
          if(Math.hypot(p.x-d.x,p.y-d.y)<14)enterBuilding(p,b);
        }
      }
    }

    if(p.inside){
      // Civilians stay hidden while infected are nearby.
      const danger=nearestInfected({x:p.x,y:p.y});
      if(!danger||Math.hypot(danger.x-p.x,danger.y-p.y)>260){
        if(Math.random()<.01)leaveBuilding(p);
      }
      continue;
    }

    let target=null,md=1e9;
    if(p.infected){
      for(const q of people)if(!q.infected&&!q.dead&&!q.inside){
        const d=Math.hypot(q.x-p.x,q.y-p.y);
        if(d<md){md=d;target=q}
      }
    }else if(p.medic){p.vx+=(Math.random()-.5)*.18;p.vy+=(Math.random()-.5)*.18;}else if(p.defender){
      target=nearestInfected(p);
      if(target)shoot(p,target);
    }else if(!p.trait){
      p.vx+=(Math.random()-.5)*.5;p.vy+=(Math.random()-.5)*.5;
    }

    if(target&&!p.dead){
      const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
      if(p.infected){p.vx+=dx/d*.12;p.vy+=dy/d*.12}
      else if(p.defender){p.vx+=dx/d*.02;p.vy+=dy/d*.02}
    }

    let sp=Math.hypot(p.vx,p.vy);
    if(sp>1.8){p.vx=p.vx/sp*1.8;p.vy=p.vy/sp*1.8}

    let nx=p.x+p.vx,ny=p.y+p.vy;
    if(blocked(p,nx,p.y)){p.vx*=-.8;nx=p.x}
    if(blocked(p,nx,ny)){p.vy*=-.8;ny=p.y}
    p.x=Math.max(p.r,Math.min(c.width-p.r,nx));
    p.y=Math.max(p.r,Math.min(c.height-p.r,ny));
  }

  for(const b of bullets){
    b.x+=b.vx;b.y+=b.vy;b.life--;
    for(const p of people)if(p.infected&&!p.dead&&!p.inside&&Math.hypot(p.x-b.x,p.y-b.y)<12){
      p.dead=true;b.life=0;break;
    }
  }
  bullets=bullets.filter(b=>b.life>0&&b.x>-10&&b.x<c.width+10&&b.y>-10&&b.y<c.height+10);

  for(const a of people)if(a.infected&&!a.inside)for(const b of people)if(!b.infected&&!b.dead&&!b.inside){
    const d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d<=16){b.infected=true;b.defender=false;b.trait=null}
    else if(d<=30&&Math.random()<infectChance){b.infected=true;b.defender=false;b.trait=null}
  }
  
}

function draw(){
  x.clearRect(0,0,c.width,c.height);
  x.fillStyle="#263139";x.fillRect(0,0,c.width,c.height);

  x.fillStyle="#48545d";
  for(const r of roads)x.fillRect(r.x,r.y,r.w,r.h);

  // Buildings now have visible color, doors, and simple windows.
  for(const w of walls){
    x.fillStyle="#9a6b4f";x.fillRect(w.x,w.y,w.w,w.h);
    x.fillStyle="#c58b62";x.fillRect(w.x+4,w.y+4,w.w-8,6);

    x.fillStyle="#d8c7a8";
    const d=doorPoint(w);
    if(w.doorSide==="top")x.fillRect(d.x-9,w.y,18,5);
    if(w.doorSide==="bottom")x.fillRect(d.x-9,w.y+w.h-5,18,5);
    if(w.doorSide==="left")x.fillRect(w.x,d.y-9,5,18);
    if(w.doorSide==="right")x.fillRect(w.x+w.w-5,d.y-9,5,18);

    x.fillStyle="#6c8795";
    const cols=Math.max(1,Math.floor(w.w/28)),rows=Math.max(1,Math.floor(w.h/28));
    for(let ix=0;ix<cols;ix++)for(let iy=0;iy<rows;iy++){
      const wx=w.x+12+ix*28,wy=w.y+16+iy*28;
      if(wx<w.x+w.w-7&&wy<w.y+w.h-7)x.fillRect(wx,wy,9,7);
    }
  }

  x.fillStyle="#ffd84d";
  for(const b of bullets){x.beginPath();x.arc(b.x,b.y,3,0,Math.PI*2);x.fill()}

  for(const p of people){
    if(p.inside)continue;
    x.beginPath();
    x.fillStyle=p.infected?"#35c759":p.medic?"#ffffff":p.defender?"#4da3ff":"#ffd83d";
    x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill();

    x.fillStyle="#111";x.beginPath();
    x.arc(p.x-3,p.y-2,1.5,0,7);x.arc(p.x+3,p.y-2,1.5,0,7);x.fill();

    if(p.defender&&!p.infected){
      x.strokeStyle="#eaf6ff";x.lineWidth=3;x.beginPath();
      x.moveTo(p.x+5,p.y);x.lineTo(p.x+17,p.y);x.stroke();
      x.strokeStyle="#182027";x.lineWidth=1;x.stroke();
    }

    if(p.trait==="scared"&&!p.infected&&!p.defender){
      x.fillStyle="#fff";
      x.font="bold 9px Orbitron";
      x.textAlign="center";
      x.fillText("!",p.x,p.y-12);
    }
  }

  const inf=people.filter(p=>p.infected).length;
  const def=people.filter(p=>p.defender&&!p.infected).length;
  const hidden=people.filter(p=>p.inside&&!p.dead&&!p.infected).length;const med=people.filter(p=>p.medic&&!p.dead).length;
  document.getElementById("stats").textContent=
    `Population: ${people.length} | Infected: ${inf} | Healthy: ${people.length-inf} | Active defenders: ${def} | Hidden: ${hidden} | Medics: ${med} | Revived: ${revived}`;
}

function loop(){if(!paused)step();draw();requestAnimationFrame(loop)}
document.getElementById("reset").onclick=reset;
document.getElementById("pause").onclick=()=>{
  paused=!paused;
  document.getElementById("pause").textContent=paused?"RESUME":"PAUSE";
};
document.getElementById("count").oninput=e=>document.getElementById("countVal").textContent=e.target.value;
document.getElementById("chance").oninput=e=>{
  infectChance=+e.target.value/100;
  document.getElementById("chanceVal").textContent=e.target.value+"%";
};
document.getElementById("defence").oninput=e=>{
  defence=+e.target.value/100;
  for(const p of people)if(!p.infected&&!p.inside)p.defender=Math.random()<defence;
  document.getElementById("defenceVal").textContent=e.target.value+"%";
};
reset();loop();