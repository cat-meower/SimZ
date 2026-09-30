const c=document.getElementById("sim"),x=c.getContext("2d");let people=[],paused=false,infectChance=.12,defence=0,walls=[],roads=[],bullets=[];
function hit(a,b){return a.x+a.r>b.x&&a.x-a.r<b.x+b.w&&a.x-a.r<b.x+b.w&&a.y+a.r>b.y&&a.y-a.r<b.y+b.h&&a.y-a.r<b.y+b.h}
function blocked(p,nx,ny){return walls.some(w=>hit({x:nx,y:ny,r:p.r},w))}
function makeCity(){
 walls=[];roads=[];
 const vertical=[];const horizontal=[];
 for(let i=0;i<3;i++)horizontal.push(70+Math.random()*460);
 for(let i=0;i<4;i++)vertical.push(80+Math.random()*740);
 for(const y of horizontal)roads.push({x:0,y,w:c.width,h:30+Math.random()*20});
 for(const xx of vertical)roads.push({x:xx,y:0,w:30+Math.random()*20,h:c.height});
 for(let i=0;i<26;i++){
  let b,tries=0;
  do{
   const w=45+Math.random()*95,h=40+Math.random()*85;
   b={x:15+Math.random()*(c.width-w-30),y:15+Math.random()*(c.height-h-30),w,h};
   tries++;
  }while(tries<150&&(roads.some(r=>b.x<r.x+r.w&&b.x+b.w>r.x&&b.y<r.y+r.h&&b.y+b.h>r.y)||walls.some(q=>b.x<q.x+q.w+8&&b.x+b.w>q.x-8&&b.y<q.y+q.h+8&&b.y+b.h>q.y-8)));
  walls.push(b);
 }
}
function reset(){
 people=[];bullets=[];makeCity();
 const n=+document.getElementById("count").value||45;
 for(let i=0;i<n;i++){
  let p={x:15+Math.random()*870,y:15+Math.random()*570,r:8,vx:0,vy:0,infected:false,defender:Math.random()<defence,cool:Math.random()*30};
  let tries=0;while(walls.some(w=>hit(p,w))&&tries++<500){p.x=15+Math.random()*870;p.y=15+Math.random()*570}
  people.push(p);
 }
 if(people.length){people[0].infected=true;people[0].defender=false}
}
function shoot(def,target){
 const dx=target.x-def.x,dy=target.y-def.y,d=Math.hypot(dx,dy)||1;
 if(d>180||def.cool>0)return;
 def.cool=18;
 bullets.push({x:def.x,y:def.y,vx:dx/d*6,vy:dy/d*6,life:35,target});
}
function step(){
 for(const p of people){
  if(p.cool>0)p.cool--;
  let target=null,md=1e9;
  if(p.infected){
   for(const q of people)if(!q.infected&&!q.dead){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<md){md=d;target=q}}
  }else if(p.defender){
   for(const q of people)if(q.infected&&!q.dead){const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<md){md=d;target=q}}
   if(target)shoot(p,target);
  }else{
   p.vx+=(Math.random()-.5)*.5;p.vy+=(Math.random()-.5)*.5;
  }
  if(target&&!p.dead){
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
   if(p.infected){p.vx+=dx/d*.12;p.vy+=dy/d*.12}
   else if(p.defender){p.vx+=dx/d*.02;p.vy+=dy/d*.02}
  }
  let sp=Math.hypot(p.vx,p.vy);if(sp>1.8){p.vx=p.vx/sp*1.8;p.vy=p.vy/sp*1.8}
  let nx=p.x+p.vx,ny=p.y+p.vy;
  if(blocked(p,nx,p.y)){p.vx*=-.8;nx=p.x}
  if(blocked(p,nx,ny)){p.vy*=-.8;ny=p.y}
  p.x=Math.max(p.r,Math.min(c.width-p.r,nx));p.y=Math.max(p.r,Math.min(c.height-p.r,ny));
 }
 for(const b of bullets){
  b.x+=b.vx;b.y+=b.vy;b.life--;
  for(const p of people)if(p.infected&&!p.dead&&Math.hypot(p.x-b.x,p.y-b.y)<12){p.dead=true;b.life=0;break}
 }
 bullets=bullets.filter(b=>b.life>0&&b.x>-10&&b.x<c.width+10&&b.y>-10&&b.y<c.height+10);
 for(const a of people)if(a.infected)for(const b of people)if(!b.infected&&!b.dead){
  const d=Math.hypot(a.x-b.x,a.y-b.y);
  if(d<=16){b.infected=true;b.defender=false}
  else if(d<=30&&Math.random()<infectChance){b.infected=true;b.defender=false}
 }
 people=people.filter(p=>!p.dead);
}
function draw(){
 x.clearRect(0,0,c.width,c.height);x.fillStyle="#263139";x.fillRect(0,0,c.width,c.height);
 x.fillStyle="#48545d";for(const r of roads)x.fillRect(r.x,r.y,r.w,r.h);
 x.fillStyle="#7b8389";for(const w of walls){x.fillRect(w.x,w.y,w.w,w.h);x.fillStyle="#9aa1a6";x.fillRect(w.x+5,w.y+5,Math.max(4,w.w-10),5);x.fillStyle="#7b8389"}
 x.fillStyle="#ffd84d";for(const b of bullets){x.beginPath();x.arc(b.x,b.y,3,0,Math.PI*2);x.fill()}
 for(const p of people){
  x.beginPath();x.fillStyle=p.infected?"#35c759":p.defender?"#4da3ff":"#ffd83d";x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill();
  x.fillStyle="#111";x.beginPath();x.arc(p.x-3,p.y-2,1.5,0,7);x.arc(p.x+3,p.y-2,1.5,0,7);x.fill();
  if(p.defender&&!p.infected){x.strokeStyle="#eaf6ff";x.lineWidth=3;x.beginPath();x.moveTo(p.x+5,p.y);x.lineTo(p.x+17,p.y);x.stroke();x.strokeStyle="#182027";x.lineWidth=1;x.stroke()}
 }
 const inf=people.filter(p=>p.infected).length,def=people.filter(p=>p.defender&&!p.infected).length;
 document.getElementById("stats").textContent=`Population: ${people.length} | Infected: ${inf} | Healthy: ${people.length-inf} | Active defenders: ${def}`;
}
function loop(){if(!paused)step();draw();requestAnimationFrame(loop)}
document.getElementById("reset").onclick=reset;
document.getElementById("pause").onclick=()=>{paused=!paused;document.getElementById("pause").textContent=paused?"RESUME":"PAUSE"};
document.getElementById("count").oninput=e=>document.getElementById("countVal").textContent=e.target.value;
document.getElementById("chance").oninput=e=>{infectChance=+e.target.value/100;document.getElementById("chanceVal").textContent=e.target.value+"%"};
document.getElementById("defence").oninput=e=>{defence=+e.target.value/100;for(const p of people)if(!p.infected)p.defender=Math.random()<defence;document.getElementById("defenceVal").textContent=e.target.value+"%"};
reset();loop();