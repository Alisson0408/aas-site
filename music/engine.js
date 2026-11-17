/* AAS Music — motor compartilhado: acordes, diagramas, áudio, ritmos e links */
(function(){
"use strict";

/* ---------- Biblioteca de acordes (violão, afinação padrão) ----------
   frets: 6 cordas (Mi grave → Mi agudo), -1 = não tocar
   fingers: número do dedo em cada corda (0 = solta) */
var CH={
  'C':  {f:[-1,3,2,0,1,0], d:[0,3,2,0,1,0], n:'Dó maior'},
  'C7': {f:[-1,3,2,3,1,0], d:[0,3,2,4,1,0], n:'Dó com sétima'},
  'D':  {f:[-1,-1,0,2,3,2], d:[0,0,0,1,3,2], n:'Ré maior'},
  'Dm': {f:[-1,-1,0,2,3,1], d:[0,0,0,2,3,1], n:'Ré menor'},
  'D7': {f:[-1,-1,0,2,1,2], d:[0,0,0,2,1,3], n:'Ré com sétima'},
  'E':  {f:[0,2,2,1,0,0],  d:[0,2,3,1,0,0], n:'Mi maior'},
  'Em': {f:[0,2,2,0,0,0],  d:[0,2,3,0,0,0], n:'Mi menor'},
  'E7': {f:[0,2,0,1,0,0],  d:[0,2,0,1,0,0], n:'Mi com sétima'},
  'F':  {f:[-1,-1,3,2,1,1], d:[0,0,3,2,1,1], n:'Fá maior (simplificado)'},
  'G':  {f:[3,2,0,0,0,3],  d:[2,1,0,0,0,3], n:'Sol maior'},
  'G7': {f:[3,2,0,0,0,1],  d:[3,2,0,0,0,1], n:'Sol com sétima'},
  'A':  {f:[-1,0,2,2,2,0], d:[0,0,1,2,3,0], n:'Lá maior'},
  'Am': {f:[-1,0,2,2,1,0], d:[0,0,2,3,1,0], n:'Lá menor'},
  'A7': {f:[-1,0,2,0,2,0], d:[0,0,2,0,3,0], n:'Lá com sétima'},
  'B7': {f:[-1,2,1,2,0,2], d:[0,2,1,3,0,4], n:'Si com sétima'},
  'Bm': {f:[-1,2,4,4,3,2], d:[0,1,3,4,2,1], n:'Si menor'}
};
var ORDER=['C','D','E','F','G','A','Am','Dm','Em','Bm','A7','B7','C7','D7','E7','G7'];
var OPEN=[82.41,110.00,146.83,196.00,246.94,329.63];
var STRING_NAMES=['Mi','Lá','Ré','Sol','Si','Mi'];

/* ---------- Ritmos (posições em colcheias dentro do compasso) ---------- */
var STYLES={
  marcha:{nome:'Marcha (2 tempos)', bpb:2, hits:[[0,'D',1],[1,'U',.7],[2,'D',.9],[3,'U',.7]]},
  pop:{nome:'Pop / rock leve', bpb:4, hits:[[0,'D',1],[2,'D',.85],[3,'U',.7],[5,'U',.7],[6,'D',.85],[7,'U',.7]]},
  balada:{nome:'Balada / louvor', bpb:4, hits:[[0,'D',1],[2,'D',.75],[3,'U',.6],[4,'D',.9],[6,'D',.75],[7,'U',.6]]},
  valsa:{nome:'Valsa (3 tempos)', bpb:3, hits:[[0,'D',1],[2,'D',.6],[4,'D',.6]]},
  simples:{nome:'Uma batida por tempo', bpb:4, hits:[[0,'D',1],[2,'D',.8],[4,'D',.85],[6,'D',.8]]}
};

/* ---------- Normalização e leitura da sequência ---------- */
function norm(tok){
  if(!tok) return null;
  var t=tok.trim();
  var m=t.match(/^([a-gA-G])([#b]?)(m|7|m7)?$/);
  if(!m) return null;
  var k=m[1].toUpperCase()+m[2]+(m[3]||'');
  return CH[k]?k:null;
}
/* Formato:
   [Parte]
   A E | texto opcional
   A:2 E:2   (":2" = dura 2 tempos)                          */
function parse(text,defBeats){
  defBeats=+defBeats||4;
  var lines=[],segs=[],part='',bad=[];
  String(text||'').split(/\r?\n/).forEach(function(raw){
    var l=raw.trim(); if(!l) return;
    var h=l.match(/^\[(.+)\]$/); if(h){part=h[1].trim();return;}
    var p=l.indexOf('|'), cp=p>=0?l.slice(0,p):l, tx=p>=0?l.slice(p+1).trim():'';
    var chords=[];
    cp.split(/\s+/).filter(Boolean).forEach(function(tok){
      var mm=tok.match(/^([^:]+)(?::(\d+))?$/), k=mm?norm(mm[1]):null;
      if(k) chords.push({c:k,b:mm[2]?Math.max(1,Math.min(16,+mm[2])):defBeats});
      else bad.push(tok);
    });
    if(!chords.length&&!tx) return;
    var li=lines.length;
    lines.push({part:part,chords:chords,tx:tx});
    chords.forEach(function(c){segs.push({c:c.c,b:c.b,line:li,part:part});});
  });
  return {lines:lines,segs:segs,bad:bad};
}
function uniqueChords(segs){var o=[];segs.forEach(function(s){if(o.indexOf(s.c)<0)o.push(s.c);});return o;}

/* ---------- Diagrama SVG ---------- */
function diagram(key,theme){
  var c=CH[key]; if(!c) return '';
  var dark=theme==='dark';
  var ink=dark?'#f3ece0':'#2a2118', str=dark?'#ffffff80':'#5c5046', fret=dark?'#ffffff35':'#bfb2a0', dot=dark?'#c9a66b':'#a8742c', dotTx=dark?'#1a140a':'#fff', muted=dark?'#a69f94':'#5c5046';
  var W=178,H=205,x0=32,y0=40,sx=25,fy=36,s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Posição do acorde '+key+'">';
  s+='<rect x="'+x0+'" y="'+(y0-7)+'" width="'+(sx*5)+'" height="7" rx="2" fill="'+ink+'"/>';
  for(var f=1;f<=4;f++) s+='<line x1="'+x0+'" y1="'+(y0+f*fy)+'" x2="'+(x0+sx*5)+'" y2="'+(y0+f*fy)+'" stroke="'+fret+'" stroke-width="2"/>';
  for(var i=0;i<6;i++){
    var x=x0+i*sx,fr=c.f[i];
    s+='<line x1="'+x+'" y1="'+y0+'" x2="'+x+'" y2="'+(y0+4*fy)+'" stroke="'+str+'" stroke-width="'+(2.6-i*.3)+'"/>';
    if(fr<0) s+='<text x="'+x+'" y="'+(y0-14)+'" fill="#c0392b" font-size="19" font-weight="700" text-anchor="middle" font-family="Verdana">×</text>';
    else if(fr===0) s+='<circle cx="'+x+'" cy="'+(y0-20)+'" r="6" fill="none" stroke="#2e9d5f" stroke-width="2.5"/>';
    else{var y=y0+(fr-.5)*fy;s+='<circle cx="'+x+'" cy="'+y+'" r="11.5" fill="'+dot+'"/><text x="'+x+'" y="'+(y+5.5)+'" fill="'+dotTx+'" font-size="15" font-weight="700" text-anchor="middle" font-family="Verdana">'+c.d[i]+'</text>';}
  }
  for(f=1;f<=4;f++) s+='<text x="'+(x0-17)+'" y="'+(y0+(f-.5)*fy+5)+'" fill="'+muted+'" font-size="12" text-anchor="end" font-family="Verdana">'+f+'</text>';
  s+='<text x="'+(x0+sx*2.5)+'" y="'+(H-8)+'" fill="'+muted+'" font-size="13" text-anchor="middle" font-family="Verdana">grossa ← → fina</text>';
  return s+'</svg>';
}

/* ---------- Áudio: violão sintetizado (Karplus-Strong) ---------- */
var ctx=null,master=null,cache={};
function ensure(){
  if(!ctx){
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    ctx=new AC();
    var comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;
    var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200;
    master=ctx.createGain();master.gain.value=.7;
    master.connect(lp);lp.connect(comp);comp.connect(ctx.destination);
  }
  if(ctx.state==='suspended'){try{ctx.resume();}catch(e){}}
  return true;
}
function freqOf(s,f){return OPEN[s]*Math.pow(2,f/12);}
function pluck(freq){
  var k=freq.toFixed(2); if(cache[k]) return cache[k];
  var sr=ctx.sampleRate,N=Math.max(2,Math.round(sr/freq)),len=Math.floor(sr*2.6),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0),ring=new Float32Array(N),i,prev=0;
  for(i=0;i<N;i++){prev=prev*.5+(Math.random()*2-1)*.5;ring[i]=prev;}
  var decay=Math.pow(.5,1/(freq*1.15)),idx=0;
  for(i=0;i<len;i++){var a=ring[idx],b=ring[(idx+1)%N];d[i]=a;ring[idx]=decay*.5*(a+b);idx=(idx+1)%N;}
  for(i=0;i<60;i++) d[i]*=i/60;
  return cache[k]=buf;
}
function bus(){var g=ctx.createGain();g.connect(master);return {g:g,last:[]};}
function kill(b){if(!b)return;var g=b.g;try{g.gain.setTargetAtTime(0,ctx.currentTime,.04);}catch(e){}setTimeout(function(){try{g.disconnect();}catch(e){}},500);}
function note(b,s,freq,t,vel){
  var src=ctx.createBufferSource();src.buffer=pluck(freq);
  var g=ctx.createGain();g.gain.setValueAtTime(vel,t);src.connect(g);g.connect(b.g);
  if(b.last[s]){try{b.last[s].gain.setTargetAtTime(0,t,.025);}catch(e){}}
  b.last[s]=g;src.start(t);src.stop(t+2.6);
}
function strum(b,key,t,dir,vel,spread){
  var c=CH[key]; if(!c) return;
  var list=[];for(var i=0;i<6;i++) if(c.f[i]>=0) list.push(i);
  if(dir==='U') list=list.filter(function(s){return s>=2;}).reverse();
  spread=spread||.011;
  list.forEach(function(s,j){note(b,s,freqOf(s,c.f[s]),t+j*spread*(.85+Math.random()*.3),vel*(dir==='U'?.6:1)*(.85+Math.random()*.15)*.32);});
}
function click(b,t,acc){
  var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=acc?1500:1000;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(acc?.5:.35,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.06);
  o.connect(g);g.connect(b.g);o.start(t);o.stop(t+.08);
}

/* ---------- Tocadores ---------- */
var active=null;
function stopAll(){if(active){var a=active;active=null;a();}}

function hear(key){
  if(!ensure()) return false; stopAll();
  var b=bus(); strum(b,key,ctx.currentTime+.05,'D',1,.03);
  active=function(){kill(b);};
  return true;
}

/* toca uma lista de segmentos; onUpdate recebe {phase,count,seg,progress}; onEnd ao terminar */
function play(segs,opt){
  if(!segs.length||!ensure()) return null; stopAll();
  var P=STYLES[opt.style]||STYLES.pop, bpm=Math.max(30,Math.min(200,+opt.bpm||80)), spb=60/bpm;
  var b=bus(), t0=ctx.currentTime+.2, count=opt.count===false?0:4, i;
  for(i=0;i<count;i++) click(b,t0+i*spb,i===0);
  var start=t0+count*spb, beats=[];
  segs.forEach(function(s,si){for(var k=0;k<s.b;k++) beats.push(si);});
  var tl=segs.map(function(){return {s:null,e:0};});
  beats.forEach(function(si,bi){
    var bt=start+bi*spb, inBar=bi%P.bpb;
    if(tl[si].s===null) tl[si].s=bt;
    tl[si].e=bt+spb;
    if(opt.metro) click(b,bt,inBar===0);
    P.hits.forEach(function(h){ if(Math.floor(h[0]/2)===inBar) strum(b,segs[si].c,bt+(h[0]%2)*spb/2,h[1],h[2]*(inBar===0?1.05:1)); });
  });
  var end=start+beats.length*spb;
  if(!opt.loop) strum(b,segs[segs.length-1].c,end,'D',1,.025);
  var stopAt=end+(opt.loop?0:1.6), raf=0, alive=true, lastSeg=-2;
  function frame(){
    if(!alive) return;
    var now=ctx.currentTime;
    if(now<start){
      var n=count-Math.max(0,Math.floor((now-t0)/spb));
      opt.onUpdate&&opt.onUpdate({phase:'count',count:n<1?1:n,seg:-1,progress:0});
    }else{
      var cur=-1;for(var j=0;j<tl.length;j++){if(now>=tl[j].s&&now<tl[j].e){cur=j;break;}}
      if(cur<0&&now>=end) cur=segs.length-1;
      opt.onUpdate&&opt.onUpdate({phase:'play',seg:cur,changed:cur!==lastSeg,progress:Math.min(1,(now-start)/(end-start))});
      lastSeg=cur;
    }
    if(now>=stopAt){ stop(true); return; }
    raf=requestAnimationFrame(frame);
  }
  function stop(natural){
    if(!alive) return; alive=false; cancelAnimationFrame(raf); kill(b);
    if(active===stopRef) active=null;
    opt.onEnd&&opt.onEnd(!!natural);
  }
  var stopRef=function(){stop(false);};
  active=stopRef;
  frame();
  return stopRef;
}

/* ---------- Link da aula (JSON → base64url no #) ---------- */
function encode(obj){
  var bytes=new TextEncoder().encode(JSON.stringify(obj)),bin='';
  for(var i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
  return 'v1.'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decode(str){
  try{
    str=String(str||'').replace(/^#/,''); if(str.indexOf('v1.')!==0) return null;
    var b=str.slice(3).replace(/-/g,'+').replace(/_/g,'/'); while(b.length%4) b+='=';
    var bin=atob(b),bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(e){return null;}
}
/* formato compacto: {a:aluno,p:prof,t:título,r:recado,m:[{n,y:estilo,s:devagar,f:normal,b:tempos,x:texto}]} */
function pack(lesson,prof){
  return {a:lesson.aluno||'',p:prof||'',t:lesson.titulo||'',r:lesson.recado||'',
    m:(lesson.songs||[]).map(function(s){return {n:s.n,y:s.style,s:+s.slow,f:+s.normal,b:+s.beats,x:s.text};})};
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

window.AASM={CH:CH,ORDER:ORDER,STYLES:STYLES,parse:parse,uniqueChords:uniqueChords,diagram:diagram,
  hear:hear,play:play,stopAll:stopAll,encode:encode,decode:decode,pack:pack,esc:esc,norm:norm};
})();
