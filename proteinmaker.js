/* ════════════════════════════════════════
   PROTEINMAKER — JavaScript
   ════════════════════════════════════════ */

// ── DATA: Amino Acid → Musical Parameters ──
const AA = {
  // Hydrophobic nonpolar — low sine tones
  A:{ name:'Alanine',        type:'hydrophobic', freq:130.81, dur:.27, wave:'sine',     note:'C3'  },
  V:{ name:'Valine',         type:'hydrophobic', freq:146.83, dur:.28, wave:'sine',     note:'D3'  },
  I:{ name:'Isoleucine',     type:'hydrophobic', freq:164.81, dur:.34, wave:'sine',     note:'E3'  },
  L:{ name:'Leucine',        type:'hydrophobic', freq:174.61, dur:.37, wave:'sine',     note:'F3'  },
  M:{ name:'Methionine',     type:'hydrophobic', freq:196.00, dur:.42, wave:'sine',     note:'G3'  },
  F:{ name:'Phenylalanine',  type:'hydrophobic', freq:220.00, dur:.52, wave:'sine',     note:'A3'  },
  W:{ name:'Tryptophan',     type:'hydrophobic', freq:246.94, dur:.65, wave:'sine',     note:'B3'  },
  P:{ name:'Proline',        type:'hydrophobic', freq:207.65, dur:.17, wave:'sine',     note:'Ab3' },
  // Polar uncharged — mid triangle tones
  S:{ name:'Serine',         type:'polar',       freq:261.63, dur:.28, wave:'triangle', note:'C4'  },
  T:{ name:'Threonine',      type:'polar',       freq:293.66, dur:.30, wave:'triangle', note:'D4'  },
  C:{ name:'Cysteine',       type:'polar',       freq:329.63, dur:.34, wave:'triangle', note:'E4'  },
  N:{ name:'Asparagine',     type:'polar',       freq:349.23, dur:.32, wave:'triangle', note:'F4'  },
  Q:{ name:'Glutamine',      type:'polar',       freq:392.00, dur:.36, wave:'triangle', note:'G4'  },
  Y:{ name:'Tyrosine',       type:'polar',       freq:440.00, dur:.48, wave:'triangle', note:'A4'  },
  // Special — brief grace note
  G:{ name:'Glycine',        type:'special',     freq:493.88, dur:.12, wave:'sine',     note:'B4'  },
  // Positively charged — bright square tones
  H:{ name:'Histidine',      type:'positive',    freq:523.25, dur:.34, wave:'square',   note:'C5'  },
  K:{ name:'Lysine',         type:'positive',    freq:659.26, dur:.40, wave:'square',   note:'E5'  },
  R:{ name:'Arginine',       type:'positive',    freq:783.99, dur:.50, wave:'square',   note:'G5'  },
  // Negatively charged — deep sawtooth tones
  D:{ name:'Aspartate',      type:'negative',    freq:110.00, dur:.55, wave:'sawtooth', note:'A2'  },
  E:{ name:'Glutamate',      type:'negative',    freq:123.47, dur:.58, wave:'sawtooth', note:'B2'  },
};

const TC = {
  hydrophobic:'#4fa8ff', polar:'#00e8a0',
  positive:'#ff6060',    negative:'#ffaa30', special:'#8888aa'
};

const PROTEINS = [
  { key:'oxt', name:'Oxytocin',       desc:'옥시토신 (사랑 호르몬)',     seq:'CYIQNCPLG' },
  { key:'ins', name:'Insulin A+B',    desc:'인슐린 A·B사슬 연결',       seq:'GIVEQCCTSICSLYQLENYCNFVNQHLCGSHLVEALYLVCGERGFFYTPKT' },
  { key:'end', name:'β-Endorphin',    desc:'내인성 진통 펩타이드',       seq:'YGGFMTSEKSQTPLVTLFKNAIIKNAYKKGE' },
  { key:'oxy', name:'Hemoglobin α',   desc:'헤모글로빈 알파사슬 앞부분', seq:'VLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHF' },
  { key:'cov', name:'COVID-19 Spike', desc:'스파이크 RBD 단편',          seq:'NITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFK' },
  { key:'glc', name:'Glucagon',       desc:'글루카곤 (혈당 조절 호르몬)', seq:'HSQGTFTSDYSKYLDSRRAQDFVQWLMNT' },
  { key:'lyz', name:'Lysozyme',       desc:'라이소자임 (항균 효소)',      seq:'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL' },
];

const L2AA = {
  A:'A',B:'N',C:'C',D:'D',E:'E',F:'F',G:'G',H:'H',
  I:'I',J:'L',K:'K',L:'L',M:'M',N:'N',O:'Q',P:'P',
  Q:'Q',R:'R',S:'S',T:'T',U:'S',V:'V',W:'W',X:'G',Y:'Y',Z:'E'
};

// ── STATE ──
let curSeq='', isPlaying=false, stopFlag=false, playIdx=0;
let audioCtx, masterGain, analyser;
let speed=1.0, highlightIdx=-1;
let chain3d=[], rotAng=0;
let pianoNotes=[], nameSeq='';
let loopEnabled=false;

// ── AUDIO ENGINE ──
function initAudio() {
  if (audioCtx) { if (audioCtx.state==='suspended') audioCtx.resume(); return; }
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  masterGain = audioCtx.createGain(); masterGain.gain.value=0.20;
  analyser = audioCtx.createAnalyser(); analyser.fftSize=512; analyser.smoothingTimeConstant=0.82;
  const conv = audioCtx.createConvolver();
  const bLen = audioCtx.sampleRate*1.8;
  const rb = audioCtx.createBuffer(2, bLen, audioCtx.sampleRate);
  for (let c=0;c<2;c++){
    const d=rb.getChannelData(c);
    for (let i=0;i<bLen;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(audioCtx.sampleRate*.38));
  }
  conv.buffer=rb;
  const dry=audioCtx.createGain(); dry.gain.value=0.65;
  const wet=audioCtx.createGain(); wet.gain.value=0.35;
  masterGain.connect(dry); masterGain.connect(conv); conv.connect(wet);
  dry.connect(analyser); wet.connect(analyser); analyser.connect(audioCtx.destination);
}

function playNote(freq, dur, wave, cb) {
  const now=audioCtx.currentTime;
  const osc=audioCtx.createOscillator();
  const env=audioCtx.createGain();
  osc.type=wave; osc.frequency.value=freq;
  if (wave==='sine') osc.detune.value=(Math.random()-.5)*6;
  const atk=.025, rel=Math.min(dur*.5,.22);
  env.gain.setValueAtTime(0,now);
  env.gain.linearRampToValueAtTime(1,now+atk);
  env.gain.setValueAtTime(1,now+dur-rel);
  env.gain.exponentialRampToValueAtTime(.0001,now+dur);
  osc.connect(env); env.connect(masterGain);
  osc.start(now); osc.stop(now+dur);
  setTimeout(cb, dur*1000);
}

function startSequence(seq, onNote) {
  if (isPlaying) return;
  initAudio();
  isPlaying=true; stopFlag=false; playIdx=0;
  const step=()=>{
    if (stopFlag||playIdx>=seq.length){ isPlaying=false; stopFlag=false; onPlayEnd(); return; }
    const ch=seq[playIdx], d=AA[ch];
    if (d){ onNote(playIdx,ch,d); playNote(d.freq,d.dur/speed,d.wave,()=>{playIdx++;step();}); }
    else  { setTimeout(()=>{playIdx++;step();},80/speed); }
  };
  step();
}

function onPlayEnd() {
  if (loopEnabled && !stopFlag) {
    // Loop: restart after brief pause
    setTimeout(() => {
      if (loopEnabled && curSeq) {
        document.getElementById('btnPlay').click();
      }
    }, 400);
    return;
  }
  document.getElementById('playSt').textContent='재생 완료 ✓';
  document.getElementById('btnPlay').textContent='▷ \u00a0재생 PLAY';
  document.getElementById('btnPlay').disabled=false;
  document.getElementById('noteBadge').textContent='\u00a0';
  highlightIdx=-1; flashAA(-1); renderPiano(-1);
}

// ── ALPHAFOLD-STYLE 3D RIBBON ──
const c3=document.getElementById('c3d');
const x3=c3.getContext('2d');

function resizeC3(){ c3.width=c3.offsetWidth*devicePixelRatio; c3.height=c3.offsetHeight*devicePixelRatio; }

// N(blue)→C(red) rainbow — same palette as AlphaFold pLDDT/chain coloring
function rib(t, a=1) {
  const h=Math.round(240*(1-t));
  return `hsla(${h},100%,62%,${a})`;
}

// Sliding-window secondary structure prediction
function predictSS(seq) {
  const N=seq.length;
  const hSet=new Set('AELMQKRHIND');
  const eSet=new Set('VIFYWTCML');
  const ss=[];
  for (let i=0;i<N;i++){
    let h=0,e=0,w=3;
    for (let j=Math.max(0,i-w);j<=Math.min(N-1,i+w);j++){
      if(hSet.has(seq[j])) h++;
      if(eSet.has(seq[j])) e++;
    }
    ss.push(h>e&&h>w?'H':e>h&&e>w?'E':'C');
  }
  // Smooth short isolated assignments
  for (let pass=0;pass<2;pass++)
    for (let i=1;i<N-1;i++)
      if(ss[i]!==ss[i-1]&&ss[i]!==ss[i+1]) ss[i]=ss[i-1];
  return ss;
}

function buildChain(seq) {
  chain3d=[];
  const N=seq.length;
  if (!N) return;
  const ss=predictSS(seq);

  // Adaptive scale
  const SCALE=Math.min(55, Math.max(20, 560/Math.sqrt(N)));
  const RPT=3.6;
  const HR=SCALE*0.4;
  const HP=SCALE*0.13;

  // Segment runs
  const segs=[];
  let si=0;
  while(si<N){
    let ei=si+1;
    while(ei<N&&ss[ei]===ss[si]) ei++;
    segs.push({type:ss[si],start:si,end:ei});
    si=ei;
  }

  let cx=0,cy=0,cz=0;
  let helixAngle=0;

  for (let s=0;s<segs.length;s++){
    const seg=segs[s];
    const len=seg.end-seg.start;
    const ox=cx,oy=cy,oz=cz;
    // Vary segment direction each time to create compact globular shape
    const da=s*1.18;
    const segDX=Math.cos(da)*SCALE*0.14;
    const segDZ=Math.sin(da)*SCALE*0.12;

    for (let i=seg.start;i<seg.end;i++){
      const t=i/(N-1||1);
      const lt=(i-seg.start);

      if (seg.type==='H'){
        helixAngle+=2*Math.PI/RPT;
        cx=ox+HR*Math.cos(helixAngle)+lt*segDX;
        cy=oy+lt*HP*2.0;
        cz=oz+HR*Math.sin(helixAngle)+lt*segDZ;
      } else if (seg.type==='E'){
        cx=ox+lt*segDX*1.4;
        cy=oy+lt*HP*1.2;
        cz=oz+lt*segDZ*1.4+((lt%2)*2-1)*SCALE*0.06;
      } else {
        const a=i*0.68;
        cx=ox+lt*segDX+Math.sin(a)*SCALE*0.22;
        cy=oy+lt*HP*0.9+Math.cos(a*1.4)*SCALE*0.08;
        cz=oz+lt*segDZ+Math.cos(a)*SCALE*0.18;
      }
      chain3d.push({x:cx,y:cy,z:cz,t,idx:i,ss:seg.type});
    }
    // Update origin for next segment
    if (chain3d.length>seg.start){
      const lp=chain3d[chain3d.length-1];
      cx=lp.x; cy=lp.y; cz=lp.z;
    }
  }

  // Center the model
  const mx=chain3d.reduce((s,p)=>s+p.x,0)/N;
  const my=chain3d.reduce((s,p)=>s+p.y,0)/N;
  const mz=chain3d.reduce((s,p)=>s+p.z,0)/N;
  chain3d.forEach(p=>{ p.x-=mx; p.y-=my; p.z-=mz; });
}

function proj3(x,y,z){
  const rY=rotAng, rX=Math.sin(rotAng*.41)*.33;
  const x1=x*Math.cos(rY)+z*Math.sin(rY), z1=-x*Math.sin(rY)+z*Math.cos(rY);
  const y2=y*Math.cos(rX)-z1*Math.sin(rX), z2=y*Math.sin(rX)+z1*Math.cos(rX);
  const s=340/(340+z2+140);
  return {px:x1*s, py:y2*s, pz:z2, s};
}

function draw3d(){
  const w=c3.width, h=c3.height, cx=w/2, cy=h/2, dpr=devicePixelRatio;
  x3.clearRect(0,0,w,h);

  if (!chain3d.length){
    x3.fillStyle='rgba(70,100,140,.2)';
    x3.font=`${11*dpr}px Space Mono`;
    x3.textAlign='center';
    x3.fillText('단백질을 선택하면 구조가 표시됩니다', cx, cy);
    return;
  }

  // Project
  const pts=chain3d.map(p=>{
    const {px,py,pz,s}=proj3(p.x,p.y,p.z);
    return {...p, px:cx+px*dpr, py:cy+py*dpr, pz, s};
  });

  // Depth-sort ribbon segments
  const segs=[];
  for (let i=0;i<pts.length-1;i++)
    segs.push({a:pts[i],b:pts[i+1],depth:(pts[i].pz+pts[i+1].pz)/2});
  segs.sort((a,b)=>a.depth-b.depth);

  // Draw ribbon
  for (const {a,b} of segs){
    const avgS=(a.s+b.s)/2;
    let bw = a.ss==='H' ? 9*avgS : a.ss==='E' ? 12*avgS : 5*avgS;
    const lw=bw*dpr;

    const grad=x3.createLinearGradient(a.px,a.py,b.px,b.py);
    grad.addColorStop(0,rib(a.t));
    grad.addColorStop(1,rib(b.t));

    // Outer soft glow
    x3.beginPath(); x3.moveTo(a.px,a.py); x3.lineTo(b.px,b.py);
    x3.strokeStyle=grad; x3.lineWidth=lw*2.2; x3.lineCap='round';
    x3.globalAlpha=0.14; x3.stroke(); x3.globalAlpha=1;

    // Main ribbon body
    x3.beginPath(); x3.moveTo(a.px,a.py); x3.lineTo(b.px,b.py);
    x3.strokeStyle=grad; x3.lineWidth=lw; x3.lineCap='round'; x3.stroke();

    // Bright core highlight
    x3.beginPath(); x3.moveTo(a.px,a.py); x3.lineTo(b.px,b.py);
    const hg=x3.createLinearGradient(a.px,a.py,b.px,b.py);
    hg.addColorStop(0,rib(a.t,.65)); hg.addColorStop(1,rib(b.t,.65));
    x3.strokeStyle=hg; x3.lineWidth=lw*0.28; x3.stroke();
  }

  // Beta-strand arrow heads
  for (let i=1;i<pts.length;i++){
    const p=pts[i], pv=pts[i-1];
    if (p.ss==='E'&&(i===pts.length-1||pts[i+1]?.ss!=='E')){
      const dx=p.px-pv.px, dy=p.py-pv.py;
      const ln=Math.sqrt(dx*dx+dy*dy)||1;
      const ux=dx/ln,uy=dy/ln,nx=-uy,ny=ux;
      const aw=7*p.s*dpr;
      x3.beginPath();
      x3.moveTo(p.px+ux*aw*2, p.py+uy*aw*2);
      x3.lineTo(p.px-nx*aw,   p.py-ny*aw);
      x3.lineTo(p.px+nx*aw,   p.py+ny*aw);
      x3.closePath();
      x3.fillStyle=rib(p.t); x3.fill();
    }
  }

  // Residue nodes + active highlight (depth sorted)
  [...pts].sort((a,b)=>a.pz-b.pz).forEach(p=>{
    const r=Math.max(2.5,9.5*p.s)*dpr;
    const hit=p.idx===highlightIdx;

    if (hit){
      for (let k=1;k<=3;k++){
        x3.beginPath(); x3.arc(p.px,p.py,r+(4+k*5)*dpr,0,Math.PI*2);
        x3.strokeStyle=rib(p.t); x3.lineWidth=dpr;
        x3.globalAlpha=.25/k; x3.stroke(); x3.globalAlpha=1;
      }
      const g=x3.createRadialGradient(p.px-r*.3,p.py-.3*r,r*.05,p.px,p.py,r*1.6);
      g.addColorStop(0,'#fff'); g.addColorStop(.35,rib(p.t)); g.addColorStop(1,rib(p.t,0));
      x3.beginPath(); x3.arc(p.px,p.py,r*1.6,0,Math.PI*2);
      x3.fillStyle=g; x3.fill();
    } else {
      const g=x3.createRadialGradient(p.px-r*.3,p.py-.3*r,r*.05,p.px,p.py,r);
      g.addColorStop(0,rib(p.t,1)); g.addColorStop(.55,rib(p.t,.7)); g.addColorStop(1,rib(p.t,.12));
      x3.beginPath(); x3.arc(p.px,p.py,r,0,Math.PI*2);
      x3.fillStyle=g; x3.fill();
    }
  });

  rotAng+=0.0065;
}

// ── WAVEFORM ──
const cW=document.getElementById('cWave');
const xW=cW.getContext('2d');

function resizeCW(){ cW.width=cW.offsetWidth*devicePixelRatio; cW.height=cW.offsetHeight*devicePixelRatio; }

function drawWave(){
  const w=cW.width, h=cW.height;
  xW.clearRect(0,0,w,h);
  xW.beginPath(); xW.moveTo(0,h/2); xW.lineTo(w,h/2);
  xW.strokeStyle='rgba(0,245,196,.1)'; xW.lineWidth=1; xW.stroke();
  if (!analyser||!isPlaying) return;
  const buf=new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);
  const sw=w/buf.length;
  xW.beginPath();
  for (let i=0;i<buf.length;i++){
    const v=buf[i]/128, y=(v*h)/2;
    i===0 ? xW.moveTo(0,y) : xW.lineTo(i*sw,y);
  }
  const g=xW.createLinearGradient(0,0,w,0);
  g.addColorStop(0,'rgba(0,245,196,.25)');
  g.addColorStop(.5,'rgba(136,102,255,.9)');
  g.addColorStop(1,'rgba(0,245,196,.25)');
  xW.strokeStyle=g; xW.lineWidth=1.5*devicePixelRatio;
  xW.shadowBlur=10; xW.shadowColor='rgba(0,245,196,.6)'; xW.stroke(); xW.shadowBlur=0;
}

// ── PIANO ROLL ──
const cP=document.getElementById('cPiano');
const xP=cP.getContext('2d');
const FMIN=Math.log(100), FMAX=Math.log(870);

function f2y(f,h){ return h*(1-(Math.log(f)-FMIN)/(FMAX-FMIN))*.88+h*.06; }

function buildPiano(seq){
  pianoNotes=[]; let x=0;
  for (const ch of seq){
    const d=AA[ch];
    if (!d){x+=8;continue;}
    const nw=Math.max(9,d.dur*58);
    pianoNotes.push({x,freq:d.freq,w:nw,col:TC[d.type]||'#888'});
    x+=nw+2;
  }
}

function renderPiano(activeIdx){
  if (!cP.width) return;
  const w=cP.width, h=cP.height, dpr=devicePixelRatio;
  xP.clearRect(0,0,w,h);
  [110,196,261,392,523,659,784].forEach(f=>{
    const y=f2y(f,h);
    xP.beginPath(); xP.moveTo(0,y); xP.lineTo(w,y);
    xP.strokeStyle='rgba(255,255,255,.03)'; xP.lineWidth=1; xP.stroke();
  });
  if (!pianoNotes.length){
    xP.fillStyle='rgba(70,100,140,.2)';
    xP.font=`${10*dpr}px Space Mono`;
    xP.textAlign='center';
    xP.fillText('서열 선택 후 피아노 롤이 표시됩니다',w/2,h/2);
    return;
  }
  const viewW=w/dpr;
  const lastN=pianoNotes[pianoNotes.length-1];
  const totalW=lastN.x+lastN.w;
  let scroll=0;
  if (activeIdx>=0&&pianoNotes[activeIdx]){
    const px=pianoNotes[activeIdx].x;
    scroll=Math.max(0,Math.min(px-viewW*.3,totalW-viewW));
  }
  pianoNotes.forEach((n,i)=>{
    const sx=(n.x-scroll)*dpr; if(sx+n.w*dpr<0||sx>w) return;
    const y=f2y(n.freq,h), nh=Math.max(4*dpr,9*dpr), active=i===activeIdx;
    xP.fillStyle=n.col+(active?'ff':'80');
    xP.fillRect(sx,y-nh/2,n.w*dpr-dpr,nh);
    if (active){
      xP.shadowBlur=14*dpr; xP.shadowColor=n.col;
      xP.fillStyle=n.col; xP.fillRect(sx,y-nh/2,n.w*dpr-dpr,nh);
      xP.shadowBlur=0;
    }
  });
  if (activeIdx>=0&&pianoNotes[activeIdx]){
    const hx=(pianoNotes[activeIdx].x-scroll+pianoNotes[activeIdx].w/2)*dpr;
    xP.beginPath(); xP.moveTo(hx,0); xP.lineTo(hx,h);
    xP.strokeStyle='rgba(255,255,255,.55)'; xP.lineWidth=1.5*dpr; xP.stroke();
  }
}

// ── SEQUENCE RENDERING ──
function renderSeq(seq){
  const el=document.getElementById('seqDisp'); el.innerHTML='';
  const tip=document.getElementById('tip');
  for (let i=0;i<seq.length;i++){
    const ch=seq[i], d=AA[ch], sp=document.createElement('span');
    sp.textContent=ch; sp.className='aa '+(d?d.type:'special'); sp.dataset.i=i;
    sp.addEventListener('mouseenter',()=>{
      if (!d) return;
      tip.innerHTML=`<b style="color:${TC[d.type]}">${ch}</b>\u00a0${d.name}\u00a0·\u00a0${d.note}\u00a0·\u00a0${d.type}`;
      tip.classList.add('show');
    });
    sp.addEventListener('mousemove',e=>{
      tip.style.left=(e.clientX+12)+'px';
      tip.style.top=(e.clientY-32)+'px';
    });
    sp.addEventListener('mouseleave',()=>tip.classList.remove('show'));
    el.appendChild(sp);
  }
}

function flashAA(idx){
  const spans=document.getElementById('seqDisp').querySelectorAll('.aa');
  spans.forEach(s=>s.classList.remove('lit'));
  if (idx>=0&&spans[idx]){spans[idx].classList.add('lit');spans[idx].scrollIntoView({block:'nearest',behavior:'smooth'});}
}

// ── LOAD SEQUENCE ──
function loadSeq(seq){
  curSeq=seq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,'');
  renderSeq(curSeq);
  buildChain(curSeq);
  buildPiano(curSeq);
  renderPiano(-1);
  document.getElementById('seqSt').textContent=`서열 길이: ${curSeq.length} 잔기 (residues)`;
  document.getElementById('playSt').textContent='재생 준비 완료';
  document.getElementById('pfill').style.width='0%';
  document.getElementById('noteBadge').textContent='\u00a0';
  highlightIdx=-1;
}

// ── PROTEIN BUTTONS ──
const pgrid=document.getElementById('pgrid');
PROTEINS.forEach(p=>{
  const b=document.createElement('button'); b.className='pbtn'; b.dataset.k=p.key;
  b.innerHTML=`<span class="pn">${p.name}</span><span class="pd">${p.desc}</span>`;
  b.addEventListener('click',()=>{
    document.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('cseq').value='';
    loadSeq(p.seq);
  });
  pgrid.appendChild(b);
});

document.getElementById('cseq').addEventListener('input',e=>{
  const v=e.target.value.trim();
  if (v.length>0){
    document.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('active'));
    loadSeq(v);
  }
});

// ── PLAYBACK CONTROLS ──
document.getElementById('btnPlay').addEventListener('click',()=>{
  if (!curSeq){document.getElementById('playSt').textContent='⚠ 먼저 단백질 서열을 선택하세요';return;}
  if (isPlaying) return;
  const btn=document.getElementById('btnPlay');
  btn.textContent='♪ \u00a0재생 중...'; btn.disabled=true;
  startSequence(curSeq,(idx,ch,d)=>{
    highlightIdx=idx; flashAA(idx); renderPiano(idx);
    document.getElementById('pfill').style.width=((idx+1)/curSeq.length*100)+'%';
    document.getElementById('playSt').textContent=`♪ ${idx+1}/${curSeq.length}  —  ${ch}: ${d.name}`;
    document.getElementById('noteBadge').textContent=`${d.note}  ·  ${d.wave}  ·  ${d.freq.toFixed(1)} Hz`;
  });
});

document.getElementById('btnStop').addEventListener('click',()=>{
  stopFlag=true; isPlaying=false;
  document.getElementById('btnPlay').textContent='▷ \u00a0재생 PLAY';
  document.getElementById('btnPlay').disabled=false;
  document.getElementById('playSt').textContent='정지됨';
  document.getElementById('noteBadge').textContent='\u00a0';
  highlightIdx=-1; flashAA(-1); renderPiano(-1);
});

document.getElementById('spd').addEventListener('input',e=>{
  speed=parseFloat(e.target.value);
  document.getElementById('spdV').textContent=speed.toFixed(1)+'×';
});

// ── NAME → AMINO ACID → 3D ──
document.getElementById('ninput').addEventListener('input',e=>{
  const name=e.target.value.toUpperCase().replace(/[^A-Z]/g,'');
  e.target.value=name;
  if (!name){
    nameSeq='';
    document.getElementById('nresult').innerHTML='이름의 알파벳을 아미노산 코드로 변환합니다';
    // Reset 3D to nothing
    chain3d=[];
    return;
  }
  nameSeq=name.split('').map(l=>L2AA[l]||'G').join('');

  // Mapping display
  const map=name.split('').map(l=>{
    const aa=L2AA[l]||'G', d=AA[aa], c=TC[d?d.type:'special'];
    return `<span style="color:${c}">${l}→${aa}</span>`;
  }).join('&nbsp; ');
  document.getElementById('nresult').innerHTML=
    `<div style="margin-bottom:.3rem">${map}</div>`+
    `<div style="color:rgba(0,245,196,.7);letter-spacing:.12em">${nameSeq}</div>`;

  // ★ Update 3D structure in real time from name sequence
  document.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('active'));
  document.getElementById('cseq').value='';
  // Build chain but don't interrupt playback — just update the visual
  const clean=nameSeq.replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,'');
  buildChain(clean);
  renderSeq(clean);
  buildPiano(clean);
  renderPiano(-1);
  document.getElementById('seqSt').textContent=`이름 서열: ${clean.length} 잔기`;
  curSeq=clean;
  highlightIdx=-1;
});

document.getElementById('btnNPlay').addEventListener('click',()=>{
  if (!nameSeq){
    document.getElementById('nresult').innerHTML+='<br><span style="color:#ff6060;font-size:.58rem">이름을 먼저 입력하세요</span>';
    return;
  }
  document.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('active'));
  document.getElementById('cseq').value='';
  loadSeq(nameSeq);
  setTimeout(()=>document.getElementById('btnPlay').click(),80);
});

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', e => {
  // Ignore if typing in an input
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (isPlaying) {
      document.getElementById('btnStop').click();
    } else {
      document.getElementById('btnPlay').click();
    }
  }
});

// ── LOOP TOGGLE ──
document.getElementById('btnLoop').addEventListener('click', () => {
  loopEnabled = !loopEnabled;
  const btn = document.getElementById('btnLoop');
  btn.textContent = loopEnabled ? '⟳  반복 ON' : '⟳  반복';
  btn.style.borderColor = loopEnabled ? 'var(--cyan)' : '';
  btn.style.color = loopEnabled ? 'var(--cyan)' : '';
});

// ── COPY SEQUENCE ──
document.getElementById('btnCopy').addEventListener('click', () => {
  if (!curSeq) return;
  navigator.clipboard.writeText(curSeq).then(() => {
    const btn = document.getElementById('btnCopy');
    const orig = btn.textContent;
    btn.textContent = '✓  복사됨';
    setTimeout(() => btn.textContent = orig, 1500);
  });
});


function onResize(){
  resizeC3(); resizeCW();
  cP.width=cP.offsetWidth*devicePixelRatio;
  cP.height=cP.offsetHeight*devicePixelRatio;
  renderPiano(playIdx);
}

function loop(){ draw3d(); drawWave(); requestAnimationFrame(loop); }

window.addEventListener('resize', onResize);

requestAnimationFrame(()=>{
  onResize(); loop();
  // Default: Oxytocin
  document.querySelector('.pbtn').click();
});
